import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import MeetingsPage from './pages/MeetingsPage.jsx';
import CreateMeetingPage from './pages/CreateMeetingPage.jsx';
import MeetingDetailPage from './pages/MeetingDetailPage.jsx';
import ActionItemsPage from './pages/ActionItemsPage.jsx';
import DecisionsPage from './pages/DecisionsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/meetings/create" element={<CreateMeetingPage />} />
              <Route path="/meetings/new" element={<CreateMeetingPage />} />
              <Route path="/meetings/:id" element={<MeetingDetailPage />} />
              <Route path="/action-items" element={<ActionItemsPage />} />
              <Route path="/decisions" element={<DecisionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
