import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'
import type {
  ApplicantProfileFormData,
  ApplicantProfileFormInput,
} from './applicantProfileSchema'
import { emptyApplicantProfileForm } from './applicantProfileSchema'

type ApplicantRow = Database['public']['Tables']['applicants']['Row']
type CommunityRow = Database['public']['Tables']['communities']['Row']

export type CommunityOption = Pick<CommunityRow, 'id' | 'name' | 'code'>

export function applicantRowToForm(row: ApplicantRow | null): ApplicantProfileFormInput {
  if (!row) {
    return emptyApplicantProfileForm
  }

  return {
    firstName: row.first_name,
    middleName: row.middle_name ?? '',
    surname: row.surname,
    dateOfBirth: row.date_of_birth ?? '',
    sex: row.sex ?? '',
    clan: row.clan ?? '',
    communityId: row.community_id ?? '',
    residentialAddress: row.residential_address ?? '',
    postalAddress: row.postal_address ?? '',
    telephone: row.telephone ?? '',
    mobilePhone: row.mobile_phone ?? '',
    email: row.email ?? '',
  }
}

export async function fetchCommunities(
  client: GmsSupabaseClient,
): Promise<CommunityOption[]> {
  const { data, error } = await client
    .from('communities')
    .select('id, name, code')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function fetchApplicantProfile(
  client: GmsSupabaseClient,
  userId: string,
): Promise<ApplicantRow | null> {
  const { data, error } = await client
    .from('applicants')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function saveApplicantProfile(
  client: GmsSupabaseClient,
  userId: string,
  values: ApplicantProfileFormData,
): Promise<ApplicantRow> {
  const payload: Database['public']['Tables']['applicants']['Insert'] = {
    profile_id: userId,
    first_name: values.firstName,
    middle_name: values.middleName,
    surname: values.surname,
    date_of_birth: values.dateOfBirth,
    sex: values.sex,
    clan: values.clan,
    community_id: values.communityId,
    residential_address: values.residentialAddress,
    postal_address: values.postalAddress,
    telephone: values.telephone,
    mobile_phone: values.mobilePhone,
    email: values.email,
  }

  const { data, error } = await client
    .from('applicants')
    .upsert(payload, { onConflict: 'profile_id' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
