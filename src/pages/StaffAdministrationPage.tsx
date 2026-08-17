import { useEffect, useMemo, useState } from 'react'
import { Check, ShieldCheck, UsersRound } from 'lucide-react'
import { clsx } from 'clsx'
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

const roleDescriptions: Record<UserRoleCode, string> = {
  applicant: 'Can maintain a profile and apply for grants.',
  grants_officer: 'Can review applications and move workflow statuses.',
  committee_member: 'Can participate in committee review workflows.',
  administrator: 'Can manage users, roles, programs, and system settings.',
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

function getUserDisplayName(user: AdminUserDirectoryRow | null): string {
  if (!user) {
    return 'No user selected'
  }

  return user.full_name ?? user.email ?? 'Unnamed user'
}

function roleTone(roleCode: UserRoleCode): 'blue' | 'green' | 'amber' | 'slate' {
  if (roleCode === 'administrator') {
    return 'green'
  }

  if (roleCode === 'applicant') {
    return 'blue'
  }

  return 'amber'
}

export function StaffAdministrationPage() {
  const { client } = useAuth()
  const [users, setUsers] = useState<AdminUserDirectoryRow[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRoleCode[]>>({})
  const [page, setPage] = useState(0)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const selectedUser =
    users.find((user) => user.profile_id === selectedUserId) ?? users[0] ?? null
  const selectedUserRoles = selectedUser
    ? (roleDrafts[selectedUser.profile_id] ?? normalizeRoleCodes(selectedUser.role_codes))
    : []
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
  const selectedUserHasChanges = selectedUser
    ? normalizeRoleCodes(selectedUser.role_codes).sort().join('|') !==
      [...selectedUserRoles].sort().join('|')
    : false

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
      setSelectedUserId((currentUserId) => {
        if (result.items.some((user) => user.profile_id === currentUserId)) {
          return currentUserId
        }

        return result.items[0]?.profile_id ?? null
      })
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
    <section className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="green">Administrator workspace</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Access administration
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage registered users and role access. Staff and administrator accounts
              are kept separate from applicant grant workflows.
            </p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <p className="font-semibold">Staff-only rule active</p>
            <p className="mt-1 text-emerald-800">
              Selecting a staff role automatically removes applicant access.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Users"
          value={isLoading ? 'Loading' : String(totalCount)}
          supportingText="Registered profiles"
        />
        <MetricCard
          label="Applicants"
          value={String(roleCounts.applicant)}
          supportingText="Current page"
        />
        <MetricCard
          label="Review staff"
          value={String(roleCounts.grants_officer + roleCounts.committee_member)}
          supportingText="Officer and committee"
        />
        <MetricCard
          label="Administrators"
          value={String(roleCounts.administrator)}
          supportingText="System access"
        />
      </div>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <aside className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <UsersRound className="size-4 text-blue-700" aria-hidden="true" />
              Users
            </div>
            <form className="mt-4 grid gap-3" onSubmit={handleSearch}>
              <TextField
                label="Search"
                name="searchUsers"
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Name or email"
                value={searchDraft}
              />
              <Button disabled={isLoading} type="submit">
                Search
              </Button>
            </form>
          </div>

          <div className="max-h-[34rem] overflow-y-auto">
            {users.length === 0 ? (
              <p className="p-4 text-sm text-slate-600">
                {isLoading ? 'Loading users...' : 'No users found.'}
              </p>
            ) : null}
            {users.map((user) => {
              const roles = normalizeRoleCodes(user.role_codes)
              const isSelected = user.profile_id === selectedUser?.profile_id

              return (
                <button
                  className={clsx(
                    'grid w-full gap-2 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0',
                    isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50',
                  )}
                  key={user.profile_id}
                  onClick={() => setSelectedUserId(user.profile_id)}
                  type="button"
                >
                  <span className="font-semibold text-slate-950">
                    {getUserDisplayName(user)}
                  </span>
                  <span className="text-sm text-slate-500">{user.email}</span>
                  <span className="flex flex-wrap gap-1">
                    {roles.length === 0 ? <Badge>No role</Badge> : null}
                    {roles.map((roleCode) => (
                      <Badge
                        key={`${user.profile_id}-${roleCode}`}
                        tone={roleTone(roleCode)}
                      >
                        {roleLabels[roleCode]}
                      </Badge>
                    ))}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-slate-600">
            <span>
              Page {page + 1} of {totalPages}
            </span>
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
        </aside>

        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <ShieldCheck className="size-4 text-blue-700" aria-hidden="true" />
                  Role assignment
                </div>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  {getUserDisplayName(selectedUser)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedUser?.email ?? 'Select a user from the list.'}
                </p>
              </div>
              {selectedUser ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Created {new Date(selectedUser.created_at).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          </div>

          {selectedUser ? (
            <div className="space-y-5 p-5">
              <div>
                <h4 className="text-sm font-semibold text-slate-950">Assigned roles</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUserRoles.length === 0 ? (
                    <Badge>No role selected</Badge>
                  ) : null}
                  {selectedUserRoles.map((roleCode) => (
                    <Badge key={roleCode} tone={roleTone(roleCode)}>
                      {roleLabels[roleCode]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {manageableRoleCodes.map((roleCode) => {
                  const checked = selectedUserRoles.includes(roleCode)

                  return (
                    <button
                      className={clsx(
                        'min-h-24 rounded-md border p-4 text-left transition',
                        checked
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                      key={roleCode}
                      onClick={() => handleRoleToggle(selectedUser.profile_id, roleCode)}
                      type="button"
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className={clsx(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border',
                            checked
                              ? 'border-blue-700 bg-blue-700 text-white'
                              : 'border-slate-300 bg-white',
                          )}
                        >
                          {checked ? (
                            <Check className="size-3" aria-hidden="true" />
                          ) : null}
                        </span>
                        <span>
                          <span className="block font-semibold text-slate-950">
                            {roleLabels[roleCode]}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-slate-600">
                            {roleDescriptions[roleCode]}
                          </span>
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Applicant cannot be combined with grants officer, committee member, or
                administrator. The system will keep those access paths separate.
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {selectedUserHasChanges ? 'Unsaved role changes' : 'No pending changes'}
                </p>
                <Button
                  disabled={
                    savingUserId === selectedUser.profile_id || !selectedUserHasChanges
                  }
                  onClick={() => void handleSaveRoles(selectedUser)}
                >
                  {savingUserId === selectedUser.profile_id ? 'Saving...' : 'Save roles'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-600">
              Select a user to manage roles.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
