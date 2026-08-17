import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { MetricCard } from '../components/ui/MetricCard'
import {
  createEmptyStaffDashboardCounts,
  fetchStaffDashboardCounts,
  type StaffDashboardCounts,
} from '../features/staff/staffReviewService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

export function StaffDashboardPage() {
  const { client } = useAuth()
  const [counts, setCounts] = useState<StaffDashboardCounts>(
    createEmptyStaffDashboardCounts(),
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!client) {
      return
    }

    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        setCounts(await fetchStaffDashboardCounts(client))
      } catch (caughtError) {
        setError(getErrorMessage(caughtError))
      } finally {
        setIsLoading(false)
      }
    }

    window.setTimeout(() => {
      void loadDashboard()
    }, 0)
  }, [client])

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge tone="green">Staff workspace</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Staff dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review submitted applications and move them through the grants officer
            workflow.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 active:bg-blue-900"
          to="/staff/applications"
        >
          Open review queue
        </Link>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Submitted"
          value={isLoading ? 'Loading' : String(counts.submitted)}
          supportingText="Awaiting initial review"
        />
        <MetricCard
          label="Initial review"
          value={String(counts.initial_review)}
          supportingText="Opened by staff"
        />
        <MetricCard
          label="Document verification"
          value={String(counts.document_verification)}
          supportingText="Document checks"
        />
        <MetricCard
          label="Ready for committee"
          value={String(counts.ready_for_committee)}
          supportingText="Prepared for next phase"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Review workflow</h3>
        <ol className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          {[
            'Submitted',
            'Initial Review',
            'Information Required',
            'Document Verification',
            'Eligibility Review',
            'Ready for Committee',
          ].map((step) => (
            <li
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              key={step}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
