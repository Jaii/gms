import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { ApplicantDashboardPage } from './pages/ApplicantDashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { NewApplicationPage } from './pages/NewApplicationPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { StaffDashboardPage } from './pages/StaffDashboardPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/applicant" replace />} />
        <Route path="applicant" element={<ApplicantDashboardPage />} />
        <Route path="applications/new" element={<NewApplicationPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="staff" element={<StaffDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
