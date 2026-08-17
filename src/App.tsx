import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './features/auth/AdminRoute'
import { ApplicantRoute } from './features/auth/ApplicantRoute'
import { RequireAuth } from './features/auth/RequireAuth'
import { StaffRoute } from './features/auth/StaffRoute'
import { AppShell } from './layouts/AppShell'
import { AdminRegisterPage } from './pages/AdminRegisterPage'
import { ApplicantDashboardPage } from './pages/ApplicantDashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { NewApplicationPage } from './pages/NewApplicationPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { SignInPage } from './pages/SignInPage'
import { StaffApplicationDetailPage } from './pages/StaffApplicationDetailPage'
import { StaffApplicationsPage } from './pages/StaffApplicationsPage'
import { StaffAdministrationPage } from './pages/StaffAdministrationPage'
import { StaffDashboardPage } from './pages/StaffDashboardPage'

function App() {
  return (
    <Routes>
      <Route path="sign-in" element={<SignInPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="admin/register" element={<AdminRegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/applicant" replace />} />
          <Route element={<ApplicantRoute />}>
            <Route path="applicant" element={<ApplicantDashboardPage />} />
            <Route path="applications/new" element={<NewApplicationPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route element={<StaffRoute />}>
            <Route path="staff" element={<StaffDashboardPage />} />
            <Route element={<AdminRoute />}>
              <Route path="staff/administration" element={<StaffAdministrationPage />} />
            </Route>
            <Route path="staff/applications" element={<StaffApplicationsPage />} />
            <Route
              path="staff/applications/:applicationId"
              element={<StaffApplicationDetailPage />}
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
