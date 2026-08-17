import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export function AdminRoute() {
  const { roles, status } = useAuth()

  if (status !== 'authenticated') {
    return <Navigate to="/sign-in" replace />
  }

  if (!roles.includes('administrator')) {
    return <Navigate to="/staff" replace />
  }

  return <Outlet />
}
