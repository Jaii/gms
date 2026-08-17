export type UploadDocumentInput = {
  applicationId: string
  applicantId: string
  documentTypeId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  content: Blob
}

export type StoredDocument = {
  objectKey: string
  fileName: string
  mimeType: string
  sizeBytes: number
  provider: 'backblaze-b2'
}

export interface DocumentStorageService {
  upload(input: UploadDocumentInput): Promise<StoredDocument>
  createTemporaryDownloadUrl(objectKey: string): Promise<string>
}
