import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'

type ApplicantRow = Database['public']['Tables']['applicants']['Row']
type ApplicationRow = Database['public']['Tables']['applications']['Row']
type ApplicationStatusRow = Database['public']['Tables']['application_statuses']['Row']
type ApplicationStudyRow =
  Database['public']['Tables']['application_study_details']['Row']
type ApplicationDocumentRow = Database['public']['Tables']['application_documents']['Row']
type StatusHistoryRow = Database['public']['Tables']['application_status_history']['Row']

export type StaffApplicationSummary = {
  application: ApplicationRow
  applicant: ApplicantRow | null
  status: ApplicationStatusRow | null
  studyDetails: ApplicationStudyRow | null
  documentCount: number
}

export type StaffApplicationDetail = StaffApplicationSummary & {
  documents: ApplicationDocumentRow[]
  statusHistory: Array<
    StatusHistoryRow & {
      previousStatusName: string | null
      newStatusName: string
    }
  >
}

const reviewStatusCodes = [
  'submitted',
  'initial_review',
  'information_required',
  'document_verification',
  'eligibility_review',
  'ready_for_committee',
] as const

export const staffTransitionOptions = [
  { code: 'initial_review', label: 'Move to Initial Review' },
  { code: 'information_required', label: 'Request Information' },
  { code: 'document_verification', label: 'Move to Document Verification' },
  { code: 'eligibility_review', label: 'Move to Eligibility Review' },
  { code: 'ready_for_committee', label: 'Ready for Committee' },
] as const

function mapById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]))
}

export async function fetchStaffApplicationQueue(
  client: GmsSupabaseClient,
): Promise<StaffApplicationSummary[]> {
  const { data: statuses, error: statusesError } = await client
    .from('application_statuses')
    .select('*')

  if (statusesError) {
    throw statusesError
  }

  const statusById = mapById(statuses ?? [])
  const reviewStatusIds = (statuses ?? [])
    .filter((status) =>
      reviewStatusCodes.includes(status.code as (typeof reviewStatusCodes)[number]),
    )
    .map((status) => status.id)

  if (reviewStatusIds.length === 0) {
    return []
  }

  const { data: applications, error: applicationsError } = await client
    .from('applications')
    .select('*')
    .in('status_id', reviewStatusIds)
    .order('submitted_at', { ascending: true })

  if (applicationsError) {
    throw applicationsError
  }

  const applicantIds = [...new Set((applications ?? []).map((app) => app.applicant_id))]
  const applicationIds = [...new Set((applications ?? []).map((app) => app.id))]

  const [
    { data: applicants, error: applicantsError },
    { data: studyDetails, error: studyError },
    { data: documents, error: documentsError },
  ] = await Promise.all([
    applicantIds.length > 0
      ? client.from('applicants').select('*').in('id', applicantIds)
      : Promise.resolve({ data: [], error: null }),
    applicationIds.length > 0
      ? client
          .from('application_study_details')
          .select('*')
          .in('application_id', applicationIds)
      : Promise.resolve({ data: [], error: null }),
    applicationIds.length > 0
      ? client
          .from('application_documents')
          .select('*')
          .in('application_id', applicationIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (applicantsError) {
    throw applicantsError
  }

  if (studyError) {
    throw studyError
  }

  if (documentsError) {
    throw documentsError
  }

  const applicantById = mapById(applicants ?? [])
  const studyByApplicationId = new Map(
    (studyDetails ?? []).map((study) => [study.application_id, study]),
  )

  return (applications ?? []).map((application) => ({
    application,
    applicant: applicantById.get(application.applicant_id) ?? null,
    status: statusById.get(application.status_id) ?? null,
    studyDetails: studyByApplicationId.get(application.id) ?? null,
    documentCount: (documents ?? []).filter(
      (document) => document.application_id === application.id,
    ).length,
  }))
}

export async function fetchStaffApplicationDetail(
  client: GmsSupabaseClient,
  applicationId: string,
): Promise<StaffApplicationDetail> {
  const { data: application, error: applicationError } = await client
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (applicationError) {
    throw applicationError
  }

  const [
    { data: statuses, error: statusesError },
    { data: applicant, error: applicantError },
    { data: studyDetails, error: studyError },
    { data: documents, error: documentsError },
    { data: statusHistory, error: statusHistoryError },
  ] = await Promise.all([
    client.from('application_statuses').select('*'),
    client
      .from('applicants')
      .select('*')
      .eq('id', application.applicant_id)
      .maybeSingle(),
    client
      .from('application_study_details')
      .select('*')
      .eq('application_id', application.id)
      .maybeSingle(),
    client
      .from('application_documents')
      .select('*')
      .eq('application_id', application.id)
      .order('created_at', { ascending: false }),
    client
      .from('application_status_history')
      .select('*')
      .eq('application_id', application.id)
      .order('created_at', { ascending: false }),
  ])

  if (statusesError) {
    throw statusesError
  }

  if (applicantError) {
    throw applicantError
  }

  if (studyError) {
    throw studyError
  }

  if (documentsError) {
    throw documentsError
  }

  if (statusHistoryError) {
    throw statusHistoryError
  }

  const statusById = mapById(statuses ?? [])

  return {
    application,
    applicant,
    status: statusById.get(application.status_id) ?? null,
    studyDetails,
    documentCount: documents?.length ?? 0,
    documents: documents ?? [],
    statusHistory: (statusHistory ?? []).map((history) => ({
      ...history,
      previousStatusName: history.previous_status_id
        ? (statusById.get(history.previous_status_id)?.name ?? null)
        : null,
      newStatusName: statusById.get(history.new_status_id)?.name ?? 'Unknown status',
    })),
  }
}

export async function updateApplicationStatus({
  applicationId,
  client,
  reason,
  statusCode,
}: {
  applicationId: string
  client: GmsSupabaseClient
  reason: string
  statusCode: string
}): Promise<ApplicationRow> {
  const { data, error } = await client.rpc('staff_update_application_status', {
    application_id_input: applicationId,
    new_status_code_input: statusCode,
    reason_input: reason,
  })

  if (error) {
    throw error
  }

  return data
}
