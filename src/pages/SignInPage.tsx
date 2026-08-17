import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../features/auth/useAuth'
import { signInSchema } from '../features/auth/authSchemas'
import { getErrorMessage } from '../utils/errorMessage'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function SignInPage() {
  const auth = useAuth()
  const { isConfigured } = auth
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const locationState = location.state as LocationState | null
  const redirectTo = locationState?.from?.pathname ?? '/applicant'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsed = signInSchema.safeParse({ email, password })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your sign in details.')
      return
    }

    setIsSubmitting(true)

    try {
      await auth.signIn(parsed.data)
      void navigate(redirectTo, { replace: true })
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
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Access your applicant workspace or staff review tools.
        </p>

        {!isConfigured ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Supabase is not configured yet. Create `.env` from `.env.example`, then add
            `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <TextField
            autoComplete="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
          <TextField
            autoComplete="current-password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button disabled={!isConfigured || isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Need an account?{' '}
          <Link
            className="font-semibold text-blue-700 hover:text-blue-900"
            to="/register"
          >
            Register as an applicant
          </Link>
        </p>
      </section>
    </main>
  )
}
