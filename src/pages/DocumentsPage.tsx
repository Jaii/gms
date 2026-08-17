import { Badge } from '../components/ui/Badge'

export function DocumentsPage() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <Badge tone="blue">Storage abstraction</Badge>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">Documents</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Document metadata is modeled in PostgreSQL. Binary files will be stored in a
        private Backblaze B2 bucket through a future server-side API; browser code will
        never receive B2 credentials.
      </p>
    </section>
  )
}
