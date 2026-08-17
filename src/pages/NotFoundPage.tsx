import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">Page not found</h2>
      <p className="mt-2 text-sm text-slate-600">
        The requested GMS page does not exist.
      </p>
      <Link className="mt-4 inline-flex" to="/applicant">
        <Button>Return to dashboard</Button>
      </Link>
    </section>
  )
}
