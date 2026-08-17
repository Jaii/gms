import { describe, expect, it } from 'vitest'
import { getLatestDocumentByType } from './documentChecklistService'
import type { Database } from '../../types/database'

type ApplicationDocumentRow = Database['public']['Tables']['application_documents']['Row']

function createDocument(
  documentTypeId: string,
  createdAt: string,
): ApplicationDocumentRow {
  return {
    id: crypto.randomUUID(),
    application_id: 'application-id',
    applicant_id: 'applicant-id',
    document_type_id: documentTypeId,
    original_filename: 'test.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 100,
    storage_provider: 'backblaze-b2',
    storage_object_key: 'object-key',
    status: 'uploaded',
    uploaded_by: null,
    verified_by: null,
    verified_at: null,
    rejection_reason: null,
    created_at: createdAt,
    updated_at: createdAt,
  }
}

describe('getLatestDocumentByType', () => {
  it('keeps the newest document metadata row per document type', () => {
    const latestByType = getLatestDocumentByType([
      createDocument('resume', '2026-01-01T00:00:00Z'),
      createDocument('resume', '2026-01-02T00:00:00Z'),
      createDocument('photo', '2026-01-01T00:00:00Z'),
    ])

    expect(latestByType.get('resume')?.created_at).toBe('2026-01-02T00:00:00Z')
    expect(latestByType.get('photo')?.created_at).toBe('2026-01-01T00:00:00Z')
  })
})
