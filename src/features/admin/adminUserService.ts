import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'
import type { UserRoleCode } from '../../types/domain'

export type AdminUserDirectoryRow =
  Database['public']['Functions']['admin_user_directory']['Returns'][number]

export type AdminUserDirectoryResult = {
  items: AdminUserDirectoryRow[]
  page: number
  pageSize: number
  totalCount: number
}

export const manageableRoleCodes: UserRoleCode[] = [
  'applicant',
  'grants_officer',
  'committee_member',
  'administrator',
]

export async function fetchAdminUserDirectory(
  client: GmsSupabaseClient,
  {
    page = 0,
    pageSize = 25,
    search = '',
  }: {
    page?: number
    pageSize?: number
    search?: string
  } = {},
): Promise<AdminUserDirectoryResult> {
  const { data, error } = await client.rpc('admin_user_directory', {
    limit_input: pageSize,
    offset_input: page * pageSize,
    search_input: search.trim() || null,
  })

  if (error) {
    throw error
  }

  const items = data ?? []

  return {
    items,
    page,
    pageSize,
    totalCount: items[0]?.total_count ?? 0,
  }
}

export async function updateAdminUserRoles({
  client,
  roleCodes,
  userId,
}: {
  client: GmsSupabaseClient
  roleCodes: UserRoleCode[]
  userId: string
}): Promise<UserRoleCode[]> {
  const { data, error } = await client.rpc('admin_update_user_roles', {
    role_codes_input: roleCodes,
    user_id_input: userId,
  })

  if (error) {
    throw error
  }

  return (data ?? []).filter((roleCode): roleCode is UserRoleCode =>
    manageableRoleCodes.includes(roleCode as UserRoleCode),
  )
}
