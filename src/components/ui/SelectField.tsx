import { clsx } from 'clsx'
import type { SelectHTMLAttributes } from 'react'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  children: React.ReactNode
}

export function SelectField({
  children,
  className,
  error,
  id,
  label,
  ...props
}: SelectFieldProps) {
  const inputId = id ?? props.name

  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700" htmlFor={inputId}>
      <span>{label}</span>
      <select
        className={clsx(
          'min-h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950 shadow-sm',
          'focus:border-blue-600',
          error && 'border-red-500',
          className,
        )}
        id={inputId}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  )
}
