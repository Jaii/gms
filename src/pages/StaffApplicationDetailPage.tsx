import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SelectField } from '../components/ui/SelectField'
import {
  fetchStaffApplicationDetail,
  staffTransitionOptions,
  updateApplicationStatus,
  type StaffApplicationDetail,
} from '../features/staff/staffReviewService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  return String(value)
}

export function StaffApplicationDetailPage() {
  const { applicationId } = useParams()
  const { client } = useAuth()
  const [detail, setDetail] = useState<StaffApplicationDetail | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('initial_review')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadDetail = async () => {
    if (!client) {
      return
    }

    if (!applicationId) {
      setError('Application id is missing from the route.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      setDetail(await fetchStaffApplicationDetail(client, applicationId))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    window.setTimeout(() => {
      void loadDetail()
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, applicationId])

  const handleStatusUpdate = async () => {
    if (!client || !applicationId) {
      return
    }

    setError(null)
    setMessage(null)

    if (!reason.trim()) {
      setError('Enter a reason before changing status.')
      return
    }

    setIsSaving(true)

    try {
      await updateApplicationStatus({
        applicationId,
        client,
        reason,
        statusCode: selectedStatus,
      })
      setReason('')
      setMessage('Application status updated.')
      await loadDetail()
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="green">Application review</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Loading...</h2>
      </section>
    )
  }

  if (!detail) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="amber">Not found</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Application unavailable
        </h2>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
          to="/staff/applications"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to queue
        </Link>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge tone="green">Application review</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {detail.application.application_number ?? 'Pending reference'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {detail.applicant?.first_name} {detail.applicant?.surname}
            </p>
          </div>
          <Badge tone="blue">{detail.status?.name ?? 'Unknown status'}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Applicant</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-semibold text-slate-950">
                {detail.applicant?.first_name} {detail.applicant?.middle_name}{' '}
                {detail.applicant?.surname}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-semibold text-slate-950">
                {display(detail.applicant?.email)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Mobile</dt>
              <dd className="font-semibold text-slate-950">
                {display(detail.applicant?.mobile_phone)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Current study</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Institution</dt>
              <dd className="font-semibold text-slate-950">
                {display(detail.studyDetails?.institution_name)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Course</dt>
              <dd className="font-semibold text-slate-950">
                {display(detail.studyDetails?.proposed_course)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Tuition fee</dt>
              <dd className="font-semibold text-slate-950">
                {display(detail.studyDetails?.currency)}{' '}
                {display(detail.studyDetails?.tuition_fee)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Documents</h3>
        <div className="mt-4 grid gap-3">
          {detail.documents.length === 0 ? (
            <p className="text-sm text-slate-600">No document metadata uploaded.</p>
          ) : null}
          {detail.documents.map((document) => (
            <div
              className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
              key={document.id}
            >
              <p className="font-semibold text-slate-950">{document.original_filename}</p>
              <p className="mt-1 text-slate-600">
                {document.mime_type} - {document.status}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Move through workflow</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-[18rem_1fr]">
          <SelectField
            label="New status"
            name="newStatus"
            onChange={(event) => setSelectedStatus(event.target.value)}
            value={selectedStatus}
          >
            {staffTransitionOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            <span>Reason / note</span>
            <textarea
              className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-blue-600"
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
          </label>
        </div>
        <Button
          className="mt-4 gap-2"
          disabled={isSaving}
          onClick={() => void handleStatusUpdate()}
        >
          <Save className="size-4" aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Update status'}
        </Button>
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Status history</h3>
        <div className="mt-4 grid gap-3">
          {detail.statusHistory.map((history) => (
            <div
              className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
              key={history.id}
            >
              <p className="font-semibold text-slate-950">
                {history.previousStatusName ?? 'None'} to {history.newStatusName}
              </p>
              <p className="mt-1 text-slate-600">{history.reason}</p>
              <p className="mt-1 text-xs text-slate-500">{history.created_at}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
