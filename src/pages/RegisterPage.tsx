import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../features/auth/useAuth'
import { registerSchema } from '../features/auth/authSchemas'
import { getErrorMessage } from '../utils/errorMessage'

export function RegisterPage() {
  const auth = useAuth()
  const { isConfigured } = auth
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const parsed = registerSchema.safeParse({ fullName, email, password })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your registration details.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await auth.register(parsed.data)

      if (result.needsEmailConfirmation) {
        setMessage('Account created. Check your email to confirm your sign in.')
        return
      }

      void navigate('/profile', { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-blue-700">GMS</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Register applicant account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create an account before completing your applicant profile.
        </p>

        {!isConfigured ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Supabase is not configured yet. Registration is disabled until `.env` has the
            public Supabase URL and anon key.
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <TextField
            autoComplete="name"
            label="Full name"
            name="fullName"
            onChange={(event) => setFullName(event.target.value)}
            value={fullName}
          />
          <TextField
            autoComplete="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
          <TextField
            autoComplete="new-password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button disabled={!isConfigured || isSubmitting} type="submit">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/sign-in">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
