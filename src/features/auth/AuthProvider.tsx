import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, type GmsSupabaseClient } from '../../lib/supabaseClient'
import type { UserRoleCode } from '../../types/domain'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type Profile,
} from './authContext'

function normalizeRoleCodes(roleCodes: string[] | null): UserRoleCode[] {
  const allowedRoles: UserRoleCode[] = [
    'applicant',
    'grants_officer',
    'committee_member',
    'administrator',
  ]

  return (roleCodes ?? []).filter((roleCode): roleCode is UserRoleCode =>
    allowedRoles.includes(roleCode as UserRoleCode),
  )
}

async function loadProfile(client: GmsSupabaseClient, user: User): Promise<Profile> {
  const metadata = user.user_metadata as Record<string, unknown>
  const metadataFullName = metadata.full_name
  const fullName = typeof metadataFullName === 'string' ? metadataFullName : null

  const { data, error } = await client
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: fullName,
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function loadRoles(client: GmsSupabaseClient): Promise<UserRoleCode[]> {
  const { data, error } = await client.rpc('current_user_role_codes')

  if (error) {
    throw error
  }

  return normalizeRoleCodes(data)
}

function throwIfAuthError(error: AuthError | null): void {
  if (error) {
    throw error
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = getSupabaseClient()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<UserRoleCode[]>([])
  const [status, setStatus] = useState<AuthStatus>(client ? 'loading' : 'unconfigured')

  const refreshUserContext = useCallback(async () => {
    if (!client) {
      setStatus('unconfigured')
      return
    }

    const { data, error } = await client.auth.getSession()
    throwIfAuthError(error)

    const currentSession = data.session
    setSession(currentSession)

    if (!currentSession) {
      setProfile(null)
      setRoles([])
      setStatus('unauthenticated')
      return
    }

    const [loadedProfile, loadedRoles] = await Promise.all([
      loadProfile(client, currentSession.user),
      loadRoles(client),
    ])

    setProfile(loadedProfile)
    setRoles(loadedRoles)
    setStatus('authenticated')
  }, [client])

  useEffect(() => {
    if (!client) {
      return
    }

    let isMounted = true

    const initialize = async () => {
      try {
        await refreshUserContext()
      } catch {
        if (isMounted) {
          setStatus('unauthenticated')
        }
      }
    }

    void initialize()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)

      if (!newSession) {
        setProfile(null)
        setRoles([])
        setStatus('unauthenticated')
        return
      }

      window.setTimeout(() => {
        void refreshUserContext().catch(() => {
          setStatus('unauthenticated')
        })
      }, 0)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [client, refreshUserContext])

  const value = useMemo<AuthContextValue>(() => {
    const isStaff = roles.some((role) =>
      ['grants_officer', 'committee_member', 'administrator'].includes(role),
    )

    return {
      client,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      status,
      isConfigured: Boolean(client),
      isStaff,
      signIn: async ({ email, password }) => {
        if (!client) {
          throw new Error('Supabase is not configured.')
        }

        const { error } = await client.auth.signInWithPassword({ email, password })
        throwIfAuthError(error)
        await refreshUserContext()
      },
      register: async ({ fullName, email, password }) => {
        if (!client) {
          throw new Error('Supabase is not configured.')
        }

        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        throwIfAuthError(error)

        if (data.session) {
          await refreshUserContext()
        }

        return { needsEmailConfirmation: !data.session }
      },
      signOut: async () => {
        if (!client) {
          return
        }

        const { error } = await client.auth.signOut()
        throwIfAuthError(error)
        setSession(null)
        setProfile(null)
        setRoles([])
        setStatus('unauthenticated')
      },
      refreshUserContext,
    }
  }, [client, profile, refreshUserContext, roles, session, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
