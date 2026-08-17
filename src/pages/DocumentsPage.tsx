import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileUp, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  fetchDocumentChecklistContext,
  uploadDocumentPlaceholder,
  type DocumentChecklistContext,
  type DocumentRequirementItem,
} from '../features/documents/documentChecklistService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatStatus(status: string | null): string {
  if (!status) {
    return 'Missing'
  }

  return status
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function getStatusTone(status: string | null): 'blue' | 'green' | 'amber' | 'slate' {
  if (status === 'verified') {
    return 'green'
  }

  if (status === 'uploaded' || status === 'under_review') {
    return 'blue'
  }

  if (status === 'rejected' || status === 'replacement_requested') {
    return 'amber'
  }

  return 'slate'
}

function requirementLabel(item: DocumentRequirementItem): string {
  if (item.requirement.requirement_level === 'conditional') {
    return 'Conditionally required'
  }

  return item.requirement.requirement_level === 'required' ? 'Required' : 'Optional'
}

export function DocumentsPage() {
  const { client, user } = useAuth()
  const [context, setContext] = useState<DocumentChecklistContext | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [uploadingTypeId, setUploadingTypeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const completedCount = useMemo(
    () => context?.items.filter((item) => item.latestDocument).length ?? 0,
    [context],
  )
  const requiredCount = useMemo(
    () =>
      context?.items.filter((item) => item.requirement.requirement_level !== 'optional')
        .length ?? 0,
    [context],
  )
  const uploadedRequiredCount = useMemo(
    () =>
      context?.items.filter(
        (item) =>
          item.requirement.requirement_level !== 'optional' && item.latestDocument,
      ).length ?? 0,
    [context],
  )

  const loadChecklist = async () => {
    if (!client || !user) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      setContext(await fetchDocumentChecklistContext(client, user.id))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    window.setTimeout(() => {
      void loadChecklist()
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, user])

  const handleUpload = async (item: DocumentRequirementItem) => {
    setError(null)
    setMessage(null)

    if (!client || !user || !context?.applicationId || !context.applicantId) {
      setError('Create and save a draft application before uploading documents.')
      return
    }

    const file = selectedFiles[item.documentType.id]

    if (!file) {
      setError(`Choose a file for ${item.documentType.name}.`)
      return
    }

    setUploadingTypeId(item.documentType.id)

    try {
      await uploadDocumentPlaceholder({
        applicationId: context.applicationId,
        applicantId: context.applicantId,
        client,
        documentTypeId: item.documentType.id,
        file,
        userId: user.id,
      })
      setSelectedFiles((currentFiles) => ({
        ...currentFiles,
        [item.documentType.id]: null,
      }))
      setMessage(`${item.documentType.name} metadata saved.`)
      await loadChecklist()
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setUploadingTypeId(null)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="blue">Document checklist</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Documents</h2>
        <p className="mt-2 text-sm text-slate-600">Loading document requirements...</p>
      </section>
    )
  }

  if (!context?.applicationId) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="amber">Draft required</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Save your draft application first
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Document requirements are tied to a specific application. Create and save your
          draft before preparing supporting documents.
        </p>
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        <Link className="mt-5 inline-flex" to="/applications/new">
          <Button>Go to draft application</Button>
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="blue">Document checklist</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Documents</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Upload preparation records document metadata against your draft. File
              binaries will move through a secure server-side Backblaze B2 API in a later
              phase.
            </p>
          </div>
          <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">
              {context.programName} {context.programYear}
            </p>
            <p>
              {uploadedRequiredCount} of {requiredCount} required documents uploaded
            </p>
            <p>{completedCount} total document metadata records complete</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        This phase saves metadata only. The selected file is not sent to Backblaze yet,
        and no Backblaze credentials are exposed in the browser.
      </div>

      <div className="grid gap-4">
        {context.items.map((item) => {
          const latestDocument = item.latestDocument
          const selectedFile = selectedFiles[item.documentType.id]
          const isUploading = uploadingTypeId === item.documentType.id

          return (
            <article
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              key={item.requirement.id}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {item.documentType.name}
                    </h3>
                    <Badge
                      tone={
                        item.requirement.requirement_level === 'optional'
                          ? 'slate'
                          : 'amber'
                      }
                    >
                      {requirementLabel(item)}
                    </Badge>
                    <Badge tone={getStatusTone(latestDocument?.status ?? null)}>
                      {formatStatus(latestDocument?.status ?? null)}
                    </Badge>
                  </div>
                  {item.documentType.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.documentType.description}
                    </p>
                  ) : null}

                  {latestDocument ? (
                    <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4" aria-hidden="true" />
                        <div>
                          <p className="font-semibold">
                            {latestDocument.original_filename}
                          </p>
                          <p className="mt-1">
                            {formatFileSize(latestDocument.file_size_bytes)} -{' '}
                            {latestDocument.mime_type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    <span>Choose file</span>
                    <input
                      className={clsx(
                        'block w-full text-sm text-slate-700',
                        'file:mr-3 file:rounded-md file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white',
                      )}
                      onChange={(event) =>
                        setSelectedFiles((currentFiles) => ({
                          ...currentFiles,
                          [item.documentType.id]: event.target.files?.[0] ?? null,
                        }))
                      }
                      type="file"
                    />
                  </label>
                  {selectedFile ? (
                    <p className="mt-2 text-xs text-slate-600">
                      {selectedFile.name} - {formatFileSize(selectedFile.size)}
                    </p>
                  ) : null}
                  <Button
                    className="mt-3 w-full gap-2"
                    disabled={isUploading}
                    onClick={() => void handleUpload(item)}
                  >
                    <FileUp className="size-4" aria-hidden="true" />
                    {isUploading ? 'Saving...' : 'Save metadata'}
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3 text-sm text-slate-700">
          <ShieldCheck className="mt-0.5 size-5 text-blue-700" aria-hidden="true" />
          <p>
            Document rows are private to your application under Supabase RLS. Staff
            verification and secure temporary file access will be added after real
            server-side storage is connected.
          </p>
        </div>
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  )
}
