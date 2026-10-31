import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DevDemoDrawer } from './components/common/DevDemoDrawer';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { CitizenLayout } from './layouts/CitizenLayout';
import { AuthorityLayout } from './layouts/AuthorityLayout';
import { TeamLayout } from './layouts/TeamLayout';
import { CompanyLayout } from './layouts/CompanyLayout';

// Public Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResolutionPreviewPage } from './pages/ResolutionPreviewPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Citizen Pages
import { CitizenDashboardPage } from './pages/citizen/CitizenDashboardPage';
import { CitizenReportPage } from './pages/citizen/CitizenReportPage';
import { CitizenReportsListPage } from './pages/citizen/CitizenReportsListPage';
import { CitizenReportDetailPage } from './pages/citizen/CitizenReportDetailPage';

// Authority Pages
import { AuthorityDashboardPage } from './pages/authority/AuthorityDashboardPage';
import { AuthorityReportsPage } from './pages/authority/AuthorityReportsPage';
import { AuthorityReportDetailPage } from './pages/authority/AuthorityReportDetailPage';
import { AuthorityTasksPage } from './pages/authority/AuthorityTasksPage';
import { AuthorityApprovalsPage } from './pages/authority/AuthorityApprovalsPage';
import { AuthoritySponsorshipsPage } from './pages/authority/AuthoritySponsorshipsPage';

// Repair Team Pages
import { TeamDashboardPage } from './pages/team/TeamDashboardPage';
import { TeamTasksPage } from './pages/team/TeamTasksPage';
import { TeamTaskDetailPage } from './pages/team/TeamTaskDetailPage';

// Company / CSR Pages
import { CompanyLoginPage } from './pages/company/CompanyLoginPage';
import { CompanyDashboardPage } from './pages/company/CompanyDashboardPage';
import { CompanyPotholesPage } from './pages/company/CompanyPotholesPage';
import { CompanySponsorshipsPage } from './pages/company/CompanySponsorshipsPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/company/login" element={<CompanyLoginPage />} />
            <Route path="/resolution-preview" element={<ResolutionPreviewPage />} />
          </Route>

          {/* Citizen Workspace (Role: CITIZEN) */}
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="dashboard" element={<CitizenDashboardPage />} />
            <Route path="report" element={<CitizenReportPage />} />
            <Route path="reports" element={<CitizenReportsListPage />} />
            <Route path="reports/:id" element={<CitizenReportDetailPage />} />
          </Route>

          {/* Authority Workspace (Role: AUTHORITY) */}
          <Route
            path="/authority"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY']}>
                <AuthorityLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/authority/dashboard" replace />} />
            <Route path="dashboard" element={<AuthorityDashboardPage />} />
            <Route path="reports" element={<AuthorityReportsPage />} />
            <Route path="reports/:id" element={<AuthorityReportDetailPage />} />
            <Route path="tasks" element={<AuthorityTasksPage />} />
            <Route path="approvals" element={<AuthorityApprovalsPage />} />
            <Route path="sponsorships" element={<AuthoritySponsorshipsPage />} />
          </Route>

          {/* Repair Team Workspace (Role: REPAIR_TEAM) */}
          <Route
            path="/team"
            element={
              <ProtectedRoute allowedRoles={['REPAIR_TEAM']}>
                <TeamLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/team/dashboard" replace />} />
            <Route path="dashboard" element={<TeamDashboardPage />} />
            <Route path="tasks" element={<TeamTasksPage />} />
            <Route path="tasks/:id" element={<TeamTaskDetailPage />} />
          </Route>

          {/* Company / CSR Road Repair Sponsorship Portal (Role: COMPANY) */}
          <Route
            path="/company"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CompanyDashboardPage />} />
            <Route path="dashboard" element={<CompanyDashboardPage />} />
            <Route path="potholes" element={<CompanyPotholesPage />} />
            <Route path="sponsorships" element={<CompanySponsorshipsPage />} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <DevDemoDrawer />
      </Router>
    </AuthProvider>
  );
}
