import { Badge } from '../components/ui/Badge'
import { MetricCard } from '../components/ui/MetricCard'

export function StaffDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="green">Staff workspace</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Administrative dashboard
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Placeholder staff views are ready for grants officers, committee members, and
          administrators. Production metrics will come from Supabase once authentication
          and RLS policies are connected.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Submitted"
          value="0"
          supportingText="Development placeholder"
        />
        <MetricCard
          label="Initial review"
          value="0"
          supportingText="Status-driven workflow"
        />
        <MetricCard
          label="Ready for committee"
          value="0"
          supportingText="Review queue prepared"
        />
        <MetricCard
          label="Approved funding"
          value="PGK 0.00"
          supportingText="NUMERIC in database"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Review capabilities</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Document verification statuses and metadata model</li>
            <li>Eligibility rules stored as versioned configuration</li>
            <li>Committee reviews separate from final application decisions</li>
            <li>Status changes retained in application status history</li>
          </ul>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Security boundary</h3>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            React is only the interface. Supabase Auth, PostgreSQL constraints, RLS
            policies, server-side file operations, and audit logging are the enforcement
            layers prepared in this foundation.
          </p>
        </div>
      </div>
    </section>
  )
}
