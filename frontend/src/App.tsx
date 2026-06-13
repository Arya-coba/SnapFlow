import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import QA from './pages/QA';
import Summarizer from './pages/Summerizer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classify from './pages/Classify';
import Meeting from './pages/Meeting';
import History from './pages/History';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Semua halaman yang ada di dalam MainLayout akan memiliki Sidebar dan Topbar */}
        <Route path="/" element={<MainLayout />}>
          
          {/* Default saat buka aplikasi, kita arahkan langsung ke halaman QA dulu */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="klasifikasi" element={<Classify />} />
          <Route path="qa" element={<QA />} />
          <Route path="ringkasan" element={<Summarizer />} />
          <Route path="rapat" element={<Meeting />} />
          <Route path="riwayat" element={<History />} />
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;