import { Badge } from '../components/ui/Badge'

export function ProfilePage() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <Badge tone="slate">Applicant entity</Badge>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">Profile</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Applicant profile data is intentionally separate from yearly grant applications so
        historical applications remain intact across future program years.
      </p>
    </section>
  )
}
