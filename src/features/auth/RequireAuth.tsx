import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-100 p-6 text-sm text-slate-700">
        Loading GMS session...
      </div>
    )
  }

  if (status === 'unconfigured') {
    return <Navigate to="/sign-in" replace />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  return <Outlet />
}
