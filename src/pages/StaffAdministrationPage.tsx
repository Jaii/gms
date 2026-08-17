import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  fetchAdminUserDirectory,
  manageableRoleCodes,
  updateAdminUserRoles,
  type AdminUserDirectoryRow,
} from '../features/admin/adminUserService'
import { useAuth } from '../features/auth/useAuth'
import type { UserRoleCode } from '../types/domain'
import { getErrorMessage } from '../utils/errorMessage'

const pageSize = 10

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

function getInitials(user: AdminUserDirectoryRow): string {
  const name = getUserDisplayName(user)
  const words = name.split(' ').filter(Boolean)

  if (words.length >= 2) {
    return `${words[0]?.charAt(0) ?? ''}${words[1]?.charAt(0) ?? ''}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

function getPrimaryRole(roleCodes: string[]): UserRoleCode | null {
  const roles = normalizeRoleCodes(roleCodes)

  return (
    roles.find((roleCode) => roleCode === 'administrator') ??
    roles.find((roleCode) => roleCode === 'grants_officer') ??
    roles.find((roleCode) => roleCode === 'committee_member') ??
    roles.find((roleCode) => roleCode === 'applicant') ??
    null
  )
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
  const [selectedUser, setSelectedUser] = useState<AdminUserDirectoryRow | null>(null)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRoleCode[]>>({})
  const [page, setPage] = useState(0)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)
  const tableRangeStart = totalCount === 0 ? 0 : page * pageSize + 1
  const tableRangeEnd = Math.min((page + 1) * pageSize, totalCount)
  const selectedUserRoles = selectedUser
    ? (roleDrafts[selectedUser.profile_id] ?? normalizeRoleCodes(selectedUser.role_codes))
    : []
  const selectedUserHasChanges = selectedUser
    ? normalizeRoleCodes(selectedUser.role_codes).sort().join('|') !==
      [...selectedUserRoles].sort().join('|')
    : false

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

  const visiblePageNumbers = useMemo(() => {
    const visibleCount = Math.min(totalPages, 3)
    const start = Math.max(0, Math.min(page - 1, totalPages - visibleCount))

    return Array.from({ length: visibleCount }, (_, index) => start + index)
  }, [page, totalPages])

  const metrics: Array<{
    label: string
    value: number | string
    supportingText: string
  }> = [
    {
      label: 'Total users',
      value: isLoading ? 'Loading' : totalCount,
      supportingText: 'Registered profiles',
    },
    {
      label: 'Applicants',
      value: roleCounts.applicant,
      supportingText: 'Grant applicants',
    },
    {
      label: 'Review staff',
      value: roleCounts.grants_officer + roleCounts.committee_member,
      supportingText: 'Officer and committee',
    },
    {
      label: 'Administrators',
      value: roleCounts.administrator,
      supportingText: 'System access',
    },
  ]

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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchDraft)
  }

  const handleOpenRoleEditor = (user: AdminUserDirectoryRow) => {
    setSelectedUser(user)
    setRoleDrafts((currentDrafts) => ({
      ...currentDrafts,
      [user.profile_id]:
        currentDrafts[user.profile_id] ?? normalizeRoleCodes(user.role_codes),
    }))
  }

  const handleRoleToggle = (userId: string, roleCode: UserRoleCode) => {
    setRoleDrafts((currentDrafts) => ({
      ...currentDrafts,
      [userId]: toggleRole(currentDrafts[userId] ?? [], roleCode),
    }))
  }

  const handleSaveRoles = async () => {
    if (!client || !selectedUser) {
      return
    }

    const nextRoles = roleDrafts[selectedUser.profile_id] ?? []

    if (nextRoles.length === 0) {
      setError('Select at least one role before saving.')
      return
    }

    setSavingUserId(selectedUser.profile_id)
    setError(null)
    setMessage(null)

    try {
      const updatedRoles = await updateAdminUserRoles({
        client,
        roleCodes: nextRoles,
        userId: selectedUser.profile_id,
      })
      const updatedUser = { ...selectedUser, role_codes: updatedRoles }

      setMessage(`Roles updated for ${selectedUser.email ?? 'user'}.`)
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.profile_id === selectedUser.profile_id ? updatedUser : currentUser,
        ),
      )
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [selectedUser.profile_id]: updatedRoles,
      }))
      setSelectedUser(updatedUser)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setSavingUserId(null)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Users List</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage registered users and role access across applicant, staff, and
            administrator workspaces.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Staff-only rule active
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            onClick={() => setShowAddUserModal(true)}
            type="button"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add User
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, supportingText }) => (
          <div
            className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
            key={label}
          >
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{supportingText}</p>
          </div>
        ))}
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

      <div className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <form className="relative w-full sm:w-64" onSubmit={handleSearch}>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="block h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search..."
              value={searchDraft}
            />
          </form>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            onClick={() => setShowAddUserModal(true)}
            type="button"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
            <colgroup>
              <col className="w-14" />
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[28%]" />
              <col className="w-[20%]" />
              <col className="w-32" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="border-b border-slate-200 px-5 py-3">
                  <input
                    aria-label="Select all users"
                    className="size-4 rounded border-slate-300"
                    type="checkbox"
                  />
                </th>
                <th className="border-b border-slate-200 px-5 py-3 font-semibold">
                  Name
                </th>
                <th className="border-b border-slate-200 px-5 py-3 font-semibold">
                  Position
                </th>
                <th className="border-b border-slate-200 px-5 py-3 font-semibold">
                  Email
                </th>
                <th className="border-b border-slate-200 px-5 py-3 font-semibold">
                  Roles
                </th>
                <th className="border-b border-slate-200 px-5 py-3 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-600" colSpan={6}>
                    {isLoading ? 'Loading users...' : 'No users found.'}
                  </td>
                </tr>
              ) : null}
              {users.map((user) => {
                const roles = normalizeRoleCodes(user.role_codes)
                const primaryRole = getPrimaryRole(user.role_codes)

                return (
                  <tr className="border-b border-slate-100" key={user.profile_id}>
                    <td className="border-b border-slate-100 px-5 py-4">
                      <input
                        aria-label={`Select ${getUserDisplayName(user)}`}
                        className="size-4 rounded border-slate-300"
                        type="checkbox"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                          {getInitials(user)}
                        </div>
                        <span className="truncate font-medium text-slate-950">
                          {getUserDisplayName(user)}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-slate-700">
                      <span className="block truncate">
                        {primaryRole ? roleLabels[primaryRole] : 'Unassigned'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-slate-700">
                      <span className="block truncate">{user.email ?? 'No email'}</span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {roles.length === 0 ? <Badge>No role</Badge> : null}
                        {roles.map((roleCode) => (
                          <Badge
                            key={`${user.profile_id}-${roleCode}`}
                            tone={roleTone(roleCode)}
                          >
                            {roleLabels[roleCode]}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          aria-label={`Edit roles for ${getUserDisplayName(user)}`}
                          className="text-teal-700 transition hover:text-teal-900"
                          onClick={() => handleOpenRoleEditor(user)}
                          type="button"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          aria-label="More actions"
                          className="text-slate-500 transition hover:text-slate-800"
                          type="button"
                        >
                          <MoreVertical className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {tableRangeStart} to {tableRangeEnd} of {totalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Previous page"
              className="min-h-9 px-3"
              disabled={isLoading || page === 0}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
              variant="secondary"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            {visiblePageNumbers.map((index) => (
              <button
                className={clsx(
                  'inline-flex min-h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition',
                  index === page &&
                    'border-teal-700 bg-teal-700 text-white hover:bg-teal-800',
                  index !== page &&
                    'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
                )}
                key={index}
                onClick={() => setPage(index)}
                type="button"
              >
                {index + 1}
              </button>
            ))}
            <Button
              aria-label="Next page"
              className="min-h-9 px-3"
              disabled={isLoading || page + 1 >= totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              variant="secondary"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-3xl rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Edit User</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {getUserDisplayName(selectedUser)} - {selectedUser.email}
                </p>
              </div>
              <button
                aria-label="Close edit user"
                className="text-slate-500 transition hover:text-slate-800"
                onClick={() => setSelectedUser(null)}
                type="button"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="grid gap-3 md:grid-cols-2">
                {manageableRoleCodes.map((roleCode) => {
                  const checked = selectedUserRoles.includes(roleCode)

                  return (
                    <button
                      className={clsx(
                        'min-h-24 rounded-md border p-4 text-left transition',
                        checked
                          ? 'border-teal-300 bg-teal-50'
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
                              ? 'border-teal-700 bg-teal-700 text-white'
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

              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                Applicant cannot be combined with grants officer, committee member, or
                administrator.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <Button onClick={() => setSelectedUser(null)} variant="secondary">
                Close
              </Button>
              <Button
                disabled={
                  savingUserId === selectedUser.profile_id || !selectedUserHasChanges
                }
                onClick={() => void handleSaveRoles()}
              >
                {savingUserId === selectedUser.profile_id ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddUserModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-3xl rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-xl font-semibold text-slate-950">Add User</h3>
              <button
                aria-label="Close add user"
                className="text-slate-500 transition hover:text-slate-800"
                onClick={() => setShowAddUserModal(false)}
                type="button"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                <span>Name</span>
                <input
                  className="min-h-10 rounded-md border border-slate-300 px-3"
                  placeholder="Enter Name"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                <span>Email</span>
                <input
                  className="min-h-10 rounded-md border border-slate-300 px-3"
                  placeholder="Enter Email"
                />
              </label>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                Browser admins cannot create Supabase Auth passwords directly. Register
                the user first, then return here to assign roles. A secure invitation
                workflow can be added in the next phase.
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <Button onClick={() => setShowAddUserModal(false)} variant="secondary">
                Close
              </Button>
              <button
                className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white opacity-60"
                disabled
                type="button"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
