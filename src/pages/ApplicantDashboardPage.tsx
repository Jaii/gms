import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MetricCard } from '../components/ui/MetricCard'

export function ApplicantDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge tone="blue">Applicant workspace</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">My applications</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This Phase 1 dashboard establishes the shell for applicant registration, draft
            applications, document tracking, and status history.
          </p>
        </div>
        <Button>Start application</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Current application"
          value="Draft"
          supportingText="Development data"
        />
        <MetricCard
          label="Reference number"
          value="Pending"
          supportingText="Assigned on submit"
        />
        <MetricCard
          label="Documents"
          value="0 / 0"
          supportingText="Requirements from program config"
        />
        <MetricCard
          label="Latest activity"
          value="None"
          supportingText="Audit trail pending auth"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">
          Application flow prepared
        </h3>
        <ol className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          {[
            'Personal and contact details',
            'Education history and current study',
            'Community eligibility and documents',
            'Additional information',
            'Review and declaration',
            'Submission with status history',
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
