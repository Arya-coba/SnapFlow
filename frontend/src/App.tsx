import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import QA from './pages/QA';
import Summarizer from './pages/Summerizer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classify from './pages/Classify';
import Meeting from './pages/Meeting';
import HistoryDocs from './pages/History-Docs';
import HistoryMeet from './pages/History-Meet';
import LandingPage from './Landing-Page';
import Register from './pages/Register';

function isAuthenticated() {
  const token = localStorage.getItem('snapflow_token');
  const oldAuth = localStorage.getItem('snapflow_auth');

  return Boolean(token) || oldAuth === 'true';
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Page */}
        <Route index element={<Navigate to="/landing-page" replace />} />
        <Route path="/landing-page" element={<LandingPage />} />

        {/* Auth Page: kalau sudah login, tidak boleh balik ke login/register */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected App Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="klasifikasi" element={<Classify />} />
          <Route path="qa" element={<QA />} />
          <Route path="ringkasan" element={<Summarizer />} />
          <Route path="rapat" element={<Meeting />} />
          <Route path="riwayat-dokumen" element={<HistoryDocs />} />
          <Route path="riwayat-rapat" element={<HistoryMeet />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/landing-page" replace />} />
      </Routes>
    </Router>
  );
}

export default App;