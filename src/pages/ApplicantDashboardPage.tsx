import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MetricCard } from '../components/ui/MetricCard'
import {
  fetchDraftApplicationContext,
  type DraftApplicationContext,
} from '../features/applications/applicationDraftService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

function formatStatus(context: DraftApplicationContext | null): string {
  if (!context?.application) {
    return 'Not started'
  }

  return context.application.submitted_at ? 'Submitted' : 'Draft'
}

export function ApplicantDashboardPage() {
  const { client, user } = useAuth()
  const [context, setContext] = useState<DraftApplicationContext | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!client || !user) {
      return
    }

    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        setContext(await fetchDraftApplicationContext(client, user.id))
      } catch (caughtError) {
        setError(getErrorMessage(caughtError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [client, user])

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge tone="blue">Applicant workspace</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">My applications</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track your current application, documents, reference number and latest status.
          </p>
        </div>
        <Link to="/applications/new">
          <Button>
            {context?.application ? 'Open application' : 'Start application'}
          </Button>
        </Link>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Current application"
          value={isLoading ? 'Loading' : formatStatus(context)}
          supportingText={context?.grantProgram.name ?? 'TTFSP 2026'}
        />
        <MetricCard
          label="Reference number"
          value={context?.application?.application_number ?? 'Pending'}
          supportingText="Assigned on submit"
        />
        <MetricCard
          label="Documents"
          value="Checklist"
          supportingText="Open Documents to review"
        />
        <MetricCard
          label="Latest activity"
          value={context?.application?.submitted_at ? 'Submitted' : 'Draft saved'}
          supportingText={
            context?.application?.submitted_at ?? context?.application?.updated_at
          }
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Application flow</h3>
        <ol className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          {[
            'Profile completed',
            'Draft application saved',
            'Required documents prepared',
            'Declaration accepted',
            'Application submitted',
            'Status history recorded',
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
