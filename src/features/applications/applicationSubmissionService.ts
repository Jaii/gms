import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'
import { fetchDocumentChecklistContext } from '../documents/documentChecklistService'
import type { DraftApplicationContext } from './applicationDraftService'

type ApplicationRow = Database['public']['Tables']['applications']['Row']

export type SubmissionReadinessItem = {
  label: string
  complete: boolean
}

export type SubmissionReadiness = {
  canSubmit: boolean
  items: SubmissionReadinessItem[]
}

export async function getSubmissionReadiness(
  client: GmsSupabaseClient,
  userId: string,
  context: DraftApplicationContext,
): Promise<SubmissionReadiness> {
  const checklist = await fetchDocumentChecklistContext(client, userId)
  const requiredDocuments = checklist.items.filter(
    (item) => item.requirement.requirement_level === 'required',
  )
  const uploadedRequiredDocuments = requiredDocuments.filter(
    (item) =>
      item.latestDocument &&
      ['uploaded', 'under_review', 'verified'].includes(item.latestDocument.status),
  )

  const items: SubmissionReadinessItem[] = [
    {
      label: 'Applicant profile is complete',
      complete: Boolean(context.applicant),
    },
    {
      label: 'Draft application has been saved',
      complete: Boolean(context.application),
    },
    {
      label: 'Current study details are complete',
      complete: Boolean(
        context.studyDetails?.institution_name &&
        context.studyDetails.proposed_course &&
        context.studyDetails.tuition_fee,
      ),
    },
    {
      label: 'Required documents have metadata records',
      complete:
        requiredDocuments.length > 0 &&
        uploadedRequiredDocuments.length === requiredDocuments.length,
    },
  ]

  return {
    canSubmit: items.every((item) => item.complete),
    items,
  }
}

export async function submitApplication({
  applicationId,
  client,
  declarationText,
}: {
  applicationId: string
  client: GmsSupabaseClient
  declarationText: string
}): Promise<ApplicationRow> {
  const { data, error } = await client.rpc('submit_application', {
    application_id_input: applicationId,
    declaration_text_input: declarationText,
  })

  if (error) {
    throw error
  }

  return data
}
