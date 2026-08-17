type MetricCardProps = {
  label: string
  value: string
  supportingText?: string
}

export function MetricCard({ label, value, supportingText }: MetricCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {supportingText ? (
        <p className="mt-1 text-xs text-slate-500">{supportingText}</p>
      ) : null}
    </article>
  )
}
