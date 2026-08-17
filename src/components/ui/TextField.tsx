import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function TextField({ className, error, id, label, ...props }: TextFieldProps) {
  const inputId = id ?? props.name

  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700" htmlFor={inputId}>
      <span>{label}</span>
      <input
        className={clsx(
          'min-h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950 shadow-sm',
          'placeholder:text-slate-400 focus:border-blue-600',
          error && 'border-red-500',
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? <span className="text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  )
}
