import { Badge } from '../components/ui/Badge'

const plannedSteps = [
  'Personal Details',
  'Contact Details',
  'Education History',
  'Current Study',
  'Community / Eligibility',
  'Supporting Documents',
  'Additional Information',
  'Review',
  'Declaration / Submit',
]

export function NewApplicationPage() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <Badge tone="amber">Wizard shell</Badge>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">New application</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        The full autosave-friendly application wizard belongs in Phase 2. Phase 1 keeps
        the route and step structure visible while the database and validation foundation
        are established.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {plannedSteps.map((step, index) => (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={step}>
            <p className="text-xs font-semibold text-slate-500">Step {index + 1}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{step}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
