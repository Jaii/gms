import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'

type ApplicantRow = Database['public']['Tables']['applicants']['Row']
type ApplicationRow = Database['public']['Tables']['applications']['Row']
type ApplicationStatusRow = Database['public']['Tables']['application_statuses']['Row']
type ApplicationStudyRow =
  Database['public']['Tables']['application_study_details']['Row']
type ApplicationDocumentRow = Database['public']['Tables']['application_documents']['Row']
type StatusHistoryRow = Database['public']['Tables']['application_status_history']['Row']
type StaffReviewQueueRow =
  Database['public']['Functions']['staff_review_queue']['Returns'][number]

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

export const reviewStatusCodes = [
  'submitted',
  'initial_review',
  'information_required',
  'document_verification',
  'eligibility_review',
  'ready_for_committee',
] as const

export type ReviewStatusCode = (typeof reviewStatusCodes)[number]
export type StaffReviewStatusFilter = ReviewStatusCode | 'all'

export type StaffDashboardCounts = Record<ReviewStatusCode, number>

export type StaffApplicationQueueItem = StaffReviewQueueRow

export type StaffApplicationQueueResult = {
  items: StaffApplicationQueueItem[]
  totalCount: number
  page: number
  pageSize: number
}

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

export function createEmptyStaffDashboardCounts(): StaffDashboardCounts {
  return {
    submitted: 0,
    initial_review: 0,
    information_required: 0,
    document_verification: 0,
    eligibility_review: 0,
    ready_for_committee: 0,
  }
}

export async function fetchStaffDashboardCounts(
  client: GmsSupabaseClient,
): Promise<StaffDashboardCounts> {
  const { data, error } = await client.rpc('staff_review_dashboard_counts')

  if (error) {
    throw error
  }

  const counts = createEmptyStaffDashboardCounts()

  for (const row of data ?? []) {
    if (reviewStatusCodes.includes(row.status_code as ReviewStatusCode)) {
      counts[row.status_code as ReviewStatusCode] = Number(row.total_count)
    }
  }

  return counts
}

export async function fetchStaffApplicationQueue(
  client: GmsSupabaseClient,
  {
    page = 0,
    pageSize = 25,
    search = '',
    statusFilter = 'all',
  }: {
    page?: number
    pageSize?: number
    search?: string
    statusFilter?: StaffReviewStatusFilter
  } = {},
): Promise<StaffApplicationQueueResult> {
  const { data, error } = await client.rpc('staff_review_queue', {
    limit_input: pageSize,
    offset_input: page * pageSize,
    search_input: search.trim() || null,
    status_code_input: statusFilter === 'all' ? null : statusFilter,
  })

  if (error) {
    throw error
  }

  const items = data ?? []

  return {
    items,
    totalCount: items[0]?.total_count ?? 0,
    page,
    pageSize,
  }
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
