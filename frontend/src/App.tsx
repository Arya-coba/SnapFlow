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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route index element={<Navigate to="/landing-page" replace />} />
        <Route path="landing-page" element={<LandingPage />} />
        
        <Route path="/" element={<MainLayout />}>

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="klasifikasi" element={<Classify />} />
          <Route path="qa" element={<QA />} />
          <Route path="ringkasan" element={<Summarizer />} />
          <Route path="rapat" element={<Meeting />} />
          <Route path="riwayat-dokumen" element={<HistoryDocs />} />
          <Route path="riwayat-rapat" element={<HistoryMeet />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;