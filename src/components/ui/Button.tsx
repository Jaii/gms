import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export function Button({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900',
        variant === 'secondary' &&
          'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        className,
      )}
      type={type}
      {...props}
    />
  )
}
