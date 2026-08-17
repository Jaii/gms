import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './features/auth/RequireAuth'
import { StaffRoute } from './features/auth/StaffRoute'
import { AppShell } from './layouts/AppShell'
import { ApplicantDashboardPage } from './pages/ApplicantDashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { NewApplicationPage } from './pages/NewApplicationPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { SignInPage } from './pages/SignInPage'
import { StaffDashboardPage } from './pages/StaffDashboardPage'

function App() {
  return (
    <Routes>
      <Route path="sign-in" element={<SignInPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/applicant" replace />} />
          <Route path="applicant" element={<ApplicantDashboardPage />} />
          <Route path="applications/new" element={<NewApplicationPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route element={<StaffRoute />}>
            <Route path="staff" element={<StaffDashboardPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
