import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import { BackblazeStoragePlaceholder } from '../../services/storage/backblazeStorage'
import type { Database } from '../../types/database'
import { fetchDraftApplicationContext } from '../applications/applicationDraftService'

type ApplicationDocumentRow = Database['public']['Tables']['application_documents']['Row']
type DocumentTypeRow = Database['public']['Tables']['document_types']['Row']
type RequirementRow = Database['public']['Tables']['program_document_requirements']['Row']

export type DocumentRequirementItem = {
  requirement: RequirementRow
  documentType: DocumentTypeRow
  latestDocument: ApplicationDocumentRow | null
}

export type DocumentChecklistContext = {
  applicationId: string | null
  applicantId: string | null
  programName: string
  programYear: number
  studentType: 'new' | 'continuing' | null
  items: DocumentRequirementItem[]
}

export function getLatestDocumentByType(
  documents: ApplicationDocumentRow[],
): Map<string, ApplicationDocumentRow> {
  const latestByType = new Map<string, ApplicationDocumentRow>()

  for (const document of documents) {
    const existing = latestByType.get(document.document_type_id)

    if (!existing || document.created_at > existing.created_at) {
      latestByType.set(document.document_type_id, document)
    }
  }

  return latestByType
}

function requirementApplies(
  requirement: RequirementRow,
  studentType: 'new' | 'continuing' | null,
): boolean {
  return requirement.student_type === 'all' || requirement.student_type === studentType
}

export async function fetchDocumentChecklistContext(
  client: GmsSupabaseClient,
  userId: string,
): Promise<DocumentChecklistContext> {
  const draftContext = await fetchDraftApplicationContext(client, userId)
  const studentType = draftContext.studyDetails?.student_type ?? null

  const { data: requirements, error: requirementsError } = await client
    .from('program_document_requirements')
    .select('*')
    .eq('grant_program_id', draftContext.grantProgram.id)
    .eq('active', true)
    .order('requirement_level', { ascending: true })
    .order('created_at', { ascending: true })

  if (requirementsError) {
    throw requirementsError
  }

  const applicableRequirements = (requirements ?? []).filter((requirement) =>
    requirementApplies(requirement, studentType),
  )
  const documentTypeIds = applicableRequirements.map(
    (requirement) => requirement.document_type_id,
  )

  const { data: documentTypes, error: documentTypesError } =
    documentTypeIds.length > 0
      ? await client.from('document_types').select('*').in('id', documentTypeIds)
      : { data: [], error: null }

  if (documentTypesError) {
    throw documentTypesError
  }

  const { data: documents, error: documentsError } = draftContext.application
    ? await client
        .from('application_documents')
        .select('*')
        .eq('application_id', draftContext.application.id)
        .order('created_at', { ascending: false })
    : { data: [], error: null }

  if (documentsError) {
    throw documentsError
  }

  const documentTypesById = new Map(
    (documentTypes ?? []).map((documentType) => [documentType.id, documentType]),
  )
  const latestDocumentsByType = getLatestDocumentByType(documents ?? [])

  return {
    applicationId: draftContext.application?.id ?? null,
    applicantId: draftContext.applicant?.id ?? null,
    programName: draftContext.grantProgram.name,
    programYear: draftContext.grantProgram.program_year,
    studentType,
    items: applicableRequirements
      .map((requirement) => {
        const documentType = documentTypesById.get(requirement.document_type_id)

        if (!documentType) {
          return null
        }

        return {
          requirement,
          documentType,
          latestDocument: latestDocumentsByType.get(requirement.document_type_id) ?? null,
        }
      })
      .filter((item): item is DocumentRequirementItem => item !== null),
  }
}

export async function uploadDocumentPlaceholder({
  applicationId,
  applicantId,
  client,
  documentTypeId,
  file,
  userId,
}: {
  applicationId: string
  applicantId: string
  client: GmsSupabaseClient
  documentTypeId: string
  file: File
  userId: string
}): Promise<ApplicationDocumentRow> {
  if (file.size <= 0) {
    throw new Error('Choose a non-empty file.')
  }

  const storage = new BackblazeStoragePlaceholder()
  const storedDocument = await storage.upload({
    applicationId,
    applicantId,
    documentTypeId,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    content: file,
  })

  const { data, error } = await client
    .from('application_documents')
    .insert({
      application_id: applicationId,
      applicant_id: applicantId,
      document_type_id: documentTypeId,
      original_filename: storedDocument.fileName,
      mime_type: storedDocument.mimeType,
      file_size_bytes: storedDocument.sizeBytes,
      storage_provider: storedDocument.provider,
      storage_object_key: storedDocument.objectKey,
      status: 'uploaded',
      uploaded_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
