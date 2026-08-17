import { Badge } from '../components/ui/Badge'
import { MetricCard } from '../components/ui/MetricCard'

const administrationAreas = [
  'Grant programs and annual rounds',
  'User roles and staff access',
  'Document requirements and checklists',
  'Eligibility rules and community configuration',
  'Audit logs and system reporting',
  'Deployment and integration settings',
]

export function StaffAdministrationPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="green">Administrator workspace</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Administration</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Manage system configuration, staff access, program settings, and audit controls
          separately from the staff review dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Program setup"
          value="Prepared"
          supportingText="Grant rounds and document rules"
        />
        <MetricCard
          label="Access control"
          value="Admin"
          supportingText="Roles and staff accounts"
        />
        <MetricCard
          label="Audit controls"
          value="Planned"
          supportingText="Reporting and activity review"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Administration areas</h3>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          {administrationAreas.map((area) => (
            <div
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              key={area}
            >
              {area}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
