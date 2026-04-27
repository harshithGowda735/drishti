import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './index.css';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Patient pages
import UserDashboard from './pages/user/Dashboard';
import HospitalFinder from './pages/user/HospitalFinder';
import UserAppointments from './pages/user/Appointments';
import Records from './pages/user/Records';
import AIAnalysis from './pages/user/AIAnalysis';
import Emergency from './pages/user/Emergency';

// Hospital pages
import HospitalDashboard from './pages/hospital/Dashboard';
import BedManagement from './pages/hospital/BedManagement';
import HospitalAppointments from './pages/hospital/Appointments';
import CrowdMonitor from './pages/hospital/CrowdMonitor';
import EmergencyPanel from './pages/hospital/EmergencyPanel';
import Analytics from './pages/hospital/Analytics';

// ASHA pages
import AshaDashboard from './pages/asha/Dashboard';
import AshaPatients from './pages/asha/Patients';
import AshaBookings from './pages/asha/Bookings';
import Schemes from './pages/asha/Schemes';

import { seedData } from './services/api';

function Layout({ user, onLogout }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar user={user} onLogout={onLogout} />
      <main style={{ flex: 1, marginLeft: 260, padding: '28px 32px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  useEffect(() => {
    // Seed demo data on first load
    seedData().catch(() => {});
  }, []);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { setUser(null); localStorage.removeItem('user'); };

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          {/* Patient Routes */}
          <Route path="/user" element={<UserDashboard user={user} />} />
          <Route path="/user/hospitals" element={<HospitalFinder />} />
          <Route path="/user/appointments" element={<UserAppointments user={user} />} />
          <Route path="/user/records" element={<Records user={user} />} />
          <Route path="/user/ai-analysis" element={<AIAnalysis />} />
          <Route path="/user/emergency" element={<Emergency user={user} />} />

          {/* Hospital Routes */}
          <Route path="/hospital" element={<HospitalDashboard user={user} />} />
          <Route path="/hospital/beds" element={<BedManagement />} />
          <Route path="/hospital/appointments" element={<HospitalAppointments />} />
          <Route path="/hospital/crowd" element={<CrowdMonitor />} />
          <Route path="/hospital/emergency" element={<EmergencyPanel />} />
          <Route path="/hospital/analytics" element={<Analytics />} />

          {/* ASHA Routes */}
          <Route path="/asha" element={<AshaDashboard user={user} />} />
          <Route path="/asha/patients" element={<AshaPatients />} />
          <Route path="/asha/bookings" element={<AshaBookings user={user} />} />
          <Route path="/asha/schemes" element={<Schemes />} />
        </Route>

        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to={
          user.role === 'hospital_admin' || user.role === 'doctor' ? '/hospital' :
          user.role === 'asha_worker' ? '/asha' : '/user'
        } />} />
      </Routes>
    </BrowserRouter>
  );
}
