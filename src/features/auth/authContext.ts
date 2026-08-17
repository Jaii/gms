import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'
import type { UserRoleCode } from '../../types/domain'

export type Profile = Database['public']['Tables']['profiles']['Row']

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured'

export type SignInInput = {
  email: string
  password: string
}

export type RegisterInput = {
  fullName: string
  email: string
  password: string
}

export type AuthContextValue = {
  client: GmsSupabaseClient | null
  session: Session | null
  user: User | null
  profile: Profile | null
  roles: UserRoleCode[]
  status: AuthStatus
  isConfigured: boolean
  isStaff: boolean
  signIn(input: SignInInput): Promise<void>
  register(input: RegisterInput): Promise<{ needsEmailConfirmation: boolean }>
  signOut(): Promise<void>
  refreshUserContext(): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
