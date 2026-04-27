import { useState, useEffect } from 'react';
import { getSocket, joinHospitalRoom, leaveHospitalRoom } from '../../services/socket';
import * as api from '../../services/api';

export default function HospitalDashboard({ user }) {
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [time, setTime] = useState(new Date());
  const [recentUpdates, setRecentUpdates] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Load initial hospital data
  useEffect(() => {
    loadData();
  }, [user?.hospitalId]);

  const loadData = async () => {
    try {
      const hId = user?.hospitalId;
      if (hId) {
        const [hRes, sRes] = await Promise.all([
          api.getHospital(hId),
          api.getHospitalStats(hId)
        ]);
        setHospital(hRes.data);
        setStats(sRes.data);
      } else {
        // demo: use first hospital
        const res = await api.getHospitals();
        const h = res.data[0];
        if (h) {
          setHospital(h);
          const sRes = await api.getHospitalStats(h._id);
          setStats(sRes.data);
        }
      }
    } catch { /* use demo data */ }
  };

  // Socket.io real-time subscriptions
  useEffect(() => {
    const hId = hospital?._id;
    if (!hId) return;

    const socket = getSocket();
    joinHospitalRoom(hId);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    setIsConnected(socket.connected);

    // Live bed updates
    socket.on('beds_update', (data) => {
      if (data.hospitalId !== hId) return;
      setHospital(prev => prev ? { ...prev, beds: data.beds } : prev);
      addUpdate(`Bed ${data.action === 'admit' ? 'admitted' : 'discharged'} in ${data.ward}`);
    });

    // Live crowd updates
    socket.on('crowd_update', (data) => {
      if (data.hospitalId !== hId) return;
      setHospital(prev => prev ? { ...prev, crowdCount: data.totalCount, crowdDensity: data.overallDensity } : prev);
      addUpdate(`${data.zone}: ${data.peopleCount} people (${data.density})`);
    });

    return () => {
      leaveHospitalRoom(hId);
      socket.off('beds_update');
      socket.off('crowd_update');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [hospital?._id]);

  const addUpdate = (msg) => {
    setRecentUpdates(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
  };

  const h = hospital;
  const densityColors = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444', very_high: '#dc2626' };

  const statCards = h ? [
    { icon: '🛏️', value: h.beds?.total || 0,     label: 'Total Beds',         color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { icon: '✅', value: h.beds?.available || 0,  label: 'Available Beds',     color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { icon: '🏥', value: h.beds?.icu?.available || 0, label: 'ICU Available',  color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    { icon: '🚑', value: h.beds?.emergency?.available || 0, label: 'Emergency Beds', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    { icon: '👥', value: h.crowdCount || 0,       label: 'Crowd Count',        color: densityColors[h.crowdDensity] || '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { icon: '⭐', value: h.rating || '—',         label: 'Rating',             color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ] : [];

  const recentPatients = [
    { name: 'Rajesh Kumar', dept: 'Cardiology', time: '10:30 AM', status: 'In Progress', priority: 'high' },
    { name: 'Priya Sharma', dept: 'General Medicine', time: '11:00 AM', status: 'Waiting', priority: 'normal' },
    { name: 'Amit Patel', dept: 'Emergency', time: '11:15 AM', status: 'Critical', priority: 'emergency' },
    { name: 'Sunita Devi', dept: 'Pediatrics', time: '11:30 AM', status: 'Confirmed', priority: 'normal' },
    { name: 'Mohammed Ali', dept: 'Orthopedics', time: '12:00 PM', status: 'Waiting', priority: 'normal' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📊 Hospital Dashboard</h1>
          <p>{h?.name || 'Real-time hospital operations overview'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 16, background: isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? '#10b981' : '#ef4444', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isConnected ? '#10b981' : '#ef4444' }}>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-light)' }}>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Patient Table */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>📥 Recent Patient Requests</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Priority</th><th>Patient</th><th>Department</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {recentPatients.map((p, i) => (
                  <tr key={i}>
                    <td><div style={{ width: 10, height: 10, borderRadius: '50%', background: p.priority === 'emergency' ? '#ef4444' : p.priority === 'high' ? '#f59e0b' : '#10b981' }} /></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.dept}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.time}</td>
                    <td><span className={`badge badge-${p.status === 'Critical' ? 'danger' : p.status === 'In Progress' ? 'info' : p.status === 'Confirmed' ? 'success' : 'warning'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Bed Overview */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>🛏️ Bed Overview</h3>
            <div className="card">
              {[
                { label: 'General Ward', avail: h?.beds?.general?.available || 0, total: h?.beds?.general?.total || 350, color: 'var(--primary)' },
                { label: 'ICU', avail: h?.beds?.icu?.available || 0, total: h?.beds?.icu?.total || 50, color: 'var(--danger)' },
                { label: 'Emergency', avail: h?.beds?.emergency?.available || 0, total: h?.beds?.emergency?.total || 100, color: 'var(--warning)' }
              ].map((b, i) => {
                const used = b.total - b.avail;
                const pct = b.total > 0 ? (used / b.total) * 100 : 0;
                return (
                  <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 5 }}>
                      <span style={{ fontWeight: 600 }}>{b.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{used}/{b.total} <span style={{ color: 'var(--success)' }}>({b.avail} free)</span></span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: b.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Event Log */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>⚡ Live Events</h3>
            <div className="card" style={{ padding: '8px 0', maxHeight: 200, overflowY: 'auto' }}>
              {recentUpdates.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <div style={{ animation: 'pulse 2s infinite' }}>⏳ Waiting for live updates...</div>
                </div>
              ) : recentUpdates.map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', borderBottom: i < recentUpdates.length - 1 ? '1px solid var(--border)' : 'none', animation: i === 0 ? 'fadeIn 0.3s ease' : 'none' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {u.msg}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
