import { useState, useEffect, useRef } from 'react';
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

import { gsap } from 'gsap';
import { seedData } from './services/api';

function Layout({ user, onLogout }) {
  const orb1 = useRef(null);
  const orb2 = useRef(null);
  const orb3 = useRef(null);

  useEffect(() => {
    const config = { y: '+=30', x: '+=20', duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', force3D: true };
    gsap.to(orb1.current, config);
    gsap.to(orb2.current, { ...config, y: '-=40', x: '-=15', duration: 5, delay: 1 });
    gsap.to(orb3.current, { ...config, y: '+=20', x: '-=30', duration: 6, delay: 0.5 });
  }, []);

  return (
    <div className="app-layout">
      <div ref={orb1} className="float-orb orb-1" />
      <div ref={orb2} className="float-orb orb-2" />
      <div ref={orb3} className="float-orb orb-3" />
      <Sidebar user={user} onLogout={onLogout} />
      <main className="main-content">
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
