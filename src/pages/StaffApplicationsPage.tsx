import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { MetricCard } from '../components/ui/MetricCard'
import {
  fetchStaffApplicationQueue,
  type StaffApplicationSummary,
} from '../features/staff/staffReviewService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

function applicantName(application: StaffApplicationSummary): string {
  if (!application.applicant) {
    return 'Unknown applicant'
  }

  return `${application.applicant.first_name} ${application.applicant.surname}`
}

export function StaffApplicationsPage() {
  const { client } = useAuth()
  const [applications, setApplications] = useState<StaffApplicationSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const submittedCount = useMemo(
    () => applications.filter((item) => item.status?.code === 'submitted').length,
    [applications],
  )
  const inReviewCount = useMemo(
    () => applications.filter((item) => item.status?.code !== 'submitted').length,
    [applications],
  )

  useEffect(() => {
    if (!client) {
      return
    }

    const loadApplications = async () => {
      setIsLoading(true)
      setError(null)

      try {
        setApplications(await fetchStaffApplicationQueue(client))
      } catch (caughtError) {
        setError(getErrorMessage(caughtError))
      } finally {
        setIsLoading(false)
      }
    }

    window.setTimeout(() => {
      void loadApplications()
    }, 0)
  }, [client])

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="green">Review queue</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Submitted applications
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review submitted applications, check supporting information, and move them
          through staff workflow statuses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Queue total"
          value={isLoading ? 'Loading' : String(applications.length)}
          supportingText="Submitted and active review"
        />
        <MetricCard
          label="New submissions"
          value={String(submittedCount)}
          supportingText="Awaiting initial review"
        />
        <MetricCard
          label="In review"
          value={String(inReviewCount)}
          supportingText="Already moved by staff"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="grid min-w-[44rem] grid-cols-[1.4fr_1fr_1fr_7rem] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <span>Applicant</span>
          <span>Reference</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {applications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            {isLoading ? 'Loading applications...' : 'No submitted applications yet.'}
          </p>
        ) : null}
        {applications.map((item) => (
          <div
            className="grid min-w-[44rem] grid-cols-[1.4fr_1fr_1fr_7rem] items-center gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
            key={item.application.id}
          >
            <div>
              <p className="font-semibold text-slate-950">{applicantName(item)}</p>
              <p className="text-slate-500">{item.studyDetails?.proposed_course}</p>
            </div>
            <span className="font-medium text-slate-800">
              {item.application.application_number ?? 'Pending'}
            </span>
            <Badge tone={item.status?.code === 'submitted' ? 'blue' : 'amber'}>
              {item.status?.name ?? 'Unknown'}
            </Badge>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              to={`/staff/applications/${item.application.id}`}
            >
              <Eye className="size-4" aria-hidden="true" />
              Open
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
