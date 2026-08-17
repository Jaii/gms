import { clsx } from 'clsx'

type BadgeProps = {
  tone?: 'blue' | 'green' | 'amber' | 'slate'
  children: React.ReactNode
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

export function Badge({ tone = 'slate', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}
