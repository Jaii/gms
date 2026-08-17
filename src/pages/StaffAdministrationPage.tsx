import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MetricCard } from '../components/ui/MetricCard'
import { TextField } from '../components/ui/TextField'
import {
  fetchAdminUserDirectory,
  manageableRoleCodes,
  updateAdminUserRoles,
  type AdminUserDirectoryRow,
} from '../features/admin/adminUserService'
import { useAuth } from '../features/auth/useAuth'
import type { UserRoleCode } from '../types/domain'
import { getErrorMessage } from '../utils/errorMessage'

const pageSize = 25

const roleLabels: Record<UserRoleCode, string> = {
  applicant: 'Applicant',
  grants_officer: 'Grants officer',
  committee_member: 'Committee member',
  administrator: 'Administrator',
}

const staffRoleCodes: UserRoleCode[] = [
  'grants_officer',
  'committee_member',
  'administrator',
]

function normalizeRoleCodes(roleCodes: string[]): UserRoleCode[] {
  return roleCodes.filter((roleCode): roleCode is UserRoleCode =>
    manageableRoleCodes.includes(roleCode as UserRoleCode),
  )
}

function toggleRole(
  currentRoles: UserRoleCode[],
  toggledRole: UserRoleCode,
): UserRoleCode[] {
  const nextRoles = currentRoles.includes(toggledRole)
    ? currentRoles.filter((roleCode) => roleCode !== toggledRole)
    : [...currentRoles, toggledRole]

  if (toggledRole === 'applicant' && !currentRoles.includes('applicant')) {
    return ['applicant']
  }

  if (staffRoleCodes.some((roleCode) => nextRoles.includes(roleCode))) {
    return nextRoles.filter((roleCode) => roleCode !== 'applicant')
  }

  return nextRoles
}

export function StaffAdministrationPage() {
  const { client } = useAuth()
  const [users, setUsers] = useState<AdminUserDirectoryRow[]>([])
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRoleCode[]>>({})
  const [page, setPage] = useState(0)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)
  const roleCounts = useMemo(
    () =>
      users.reduce(
        (counts, user) => {
          const roles = normalizeRoleCodes(user.role_codes)

          for (const role of roles) {
            counts[role] += 1
          }

          return counts
        },
        {
          applicant: 0,
          grants_officer: 0,
          committee_member: 0,
          administrator: 0,
        } satisfies Record<UserRoleCode, number>,
      ),
    [users],
  )

  const loadUsers = async () => {
    if (!client) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchAdminUserDirectory(client, {
        page,
        pageSize,
        search,
      })
      setUsers(result.items)
      setTotalCount(result.totalCount)
      setRoleDrafts(
        Object.fromEntries(
          result.items.map((user) => [
            user.profile_id,
            normalizeRoleCodes(user.role_codes),
          ]),
        ),
      )
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    window.setTimeout(() => {
      void loadUsers()
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, page, search])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchDraft)
  }

  const handleRoleToggle = (userId: string, roleCode: UserRoleCode) => {
    setRoleDrafts((currentDrafts) => ({
      ...currentDrafts,
      [userId]: toggleRole(currentDrafts[userId] ?? [], roleCode),
    }))
  }

  const handleSaveRoles = async (user: AdminUserDirectoryRow) => {
    if (!client) {
      return
    }

    const nextRoles = roleDrafts[user.profile_id] ?? []

    if (nextRoles.length === 0) {
      setError('Select at least one role before saving.')
      return
    }

    setSavingUserId(user.profile_id)
    setError(null)
    setMessage(null)

    try {
      const updatedRoles = await updateAdminUserRoles({
        client,
        roleCodes: nextRoles,
        userId: user.profile_id,
      })

      setMessage(`Roles updated for ${user.email ?? user.full_name ?? 'user'}.`)
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.profile_id === user.profile_id
            ? { ...currentUser, role_codes: updatedRoles }
            : currentUser,
        ),
      )
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [user.profile_id]: updatedRoles,
      }))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setSavingUserId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="green">Administrator workspace</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Administration</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Manage registered users and role access. Staff and administrator accounts are
          kept separate from applicant grant workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Users"
          value={isLoading ? 'Loading' : String(totalCount)}
          supportingText="Registered profiles"
        />
        <MetricCard
          label="Applicants"
          value={String(roleCounts.applicant)}
          supportingText="This page"
        />
        <MetricCard
          label="Staff"
          value={String(roleCounts.grants_officer + roleCounts.committee_member)}
          supportingText="Review users"
        />
        <MetricCard
          label="Administrators"
          value={String(roleCounts.administrator)}
          supportingText="System access"
        />
      </div>

      <form
        className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]"
        onSubmit={handleSearch}
      >
        <TextField
          label="Search users"
          name="searchUsers"
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Name or email"
          value={searchDraft}
        />
        <Button className="self-end" disabled={isLoading} type="submit">
          Search
        </Button>
      </form>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="grid min-w-[60rem] grid-cols-[1.4fr_1fr_2fr_8rem] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <span>User</span>
          <span>Created</span>
          <span>Roles</span>
          <span>Action</span>
        </div>
        {users.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            {isLoading ? 'Loading users...' : 'No users found.'}
          </p>
        ) : null}
        {users.map((user) => {
          const draftRoles = roleDrafts[user.profile_id] ?? []
          const isSaving = savingUserId === user.profile_id

          return (
            <div
              className="grid min-w-[60rem] grid-cols-[1.4fr_1fr_2fr_8rem] items-center gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
              key={user.profile_id}
            >
              <div>
                <p className="font-semibold text-slate-950">
                  {user.full_name ?? 'No full name'}
                </p>
                <p className="text-slate-500">{user.email ?? 'No email'}</p>
              </div>
              <span className="text-slate-600">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {manageableRoleCodes.map((roleCode) => (
                  <label
                    className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3"
                    key={`${user.profile_id}-${roleCode}`}
                  >
                    <input
                      checked={draftRoles.includes(roleCode)}
                      className="size-4"
                      onChange={() => handleRoleToggle(user.profile_id, roleCode)}
                      type="checkbox"
                    />
                    <span>{roleLabels[roleCode]}</span>
                  </label>
                ))}
              </div>
              <Button
                disabled={isSaving}
                onClick={() => void handleSaveRoles(user)}
                variant="secondary"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          Page {page + 1} of {totalPages}, showing {users.length} of {totalCount} users.
        </p>
        <div className="flex gap-2">
          <Button
            disabled={isLoading || page === 0}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            disabled={isLoading || page + 1 >= totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  )
}
