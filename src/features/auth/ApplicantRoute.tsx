import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ApplicantRoute() {
  const { isStaff, status } = useAuth()

  if (status !== 'authenticated') {
    return <Navigate to="/sign-in" replace />
  }

  if (isStaff) {
    return <Navigate to="/staff" replace />
  }

  return <Outlet />
}
