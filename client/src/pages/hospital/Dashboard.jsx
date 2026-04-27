import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { getSocket, joinHospitalRoom, leaveHospitalRoom } from '../../services/socket';
import * as api from '../../services/api';

export default function HospitalDashboard({ user }) {
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [time, setTime] = useState(new Date());
  const [recentUpdates, setRecentUpdates] = useState([]);
  const statsRef = useRef(null);
  const mainGridRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { force3D: true } });
      tl.fromTo(statsRef.current?.children || [], { y: 15, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' })
        .fromTo(mainGridRef.current?.children || [], { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, '-=0.25');
    });
    return () => ctx.revert();
  }, [hospital?._id]);

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

    socket.on('beds_update', (data) => {
      if (data.hospitalId !== hId) return;
      setHospital(prev => prev ? { ...prev, beds: data.beds } : prev);
      addUpdate(`Bed ${data.action === 'admit' ? 'admitted' : 'discharged'} in ${data.ward}`);
    });

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
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📊 Hospital Dashboard</h1>
          <p style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{h?.name || 'Loading hospital...'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#10b981' : '#ef4444', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isConnected ? '#10b981' : '#ef4444' }}>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div ref={statsRef} className="grid-4" style={{ marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.8rem' }}>{s.value}</div>
            <div className="stat-label" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div ref={mainGridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Patient Table */}
        <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>📥 Recent Admissions</h3>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>Priority</th><th>Patient</th><th>Dept</th><th>Status</th></tr></thead>
              <tbody>
                {recentPatients.map((p, i) => (
                  <tr key={i}>
                    <td><div style={{ width: 12, height: 12, borderRadius: '50%', background: p.priority === 'emergency' ? '#ef4444' : p.priority === 'high' ? '#f59e0b' : '#10b981', boxShadow: `0 0 10px ${p.priority === 'emergency' ? '#ef444440' : 'transparent'}` }} /></td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.dept}</td>
                    <td><span className={`badge badge-${p.status === 'Critical' ? 'danger' : p.status === 'In Progress' ? 'info' : p.status === 'Confirmed' ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem' }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Bed Overview */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 18 }}>🛏️ Capacity Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { label: 'General Ward', avail: h?.beds?.general?.available || 0, total: h?.beds?.general?.total || 350, color: 'var(--primary)' },
                { label: 'ICU Unit', avail: h?.beds?.icu?.available || 0, total: h?.beds?.icu?.total || 50, color: 'var(--danger)' },
                { label: 'Emergency Bay', avail: h?.beds?.emergency?.available || 0, total: h?.beds?.emergency?.total || 100, color: 'var(--warning)' }
              ].map((b, i) => {
                const used = b.total - b.avail;
                const pct = b.total > 0 ? (used / b.total) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700 }}>{b.label}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{used}</span>/{b.total} 
                        <span style={{ color: 'var(--success)', marginLeft: 8, fontWeight: 700 }}>({b.avail} free)</span>
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: 8, background: 'rgba(255,255,255,0.05)' }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: b.color, boxShadow: `0 0 12px ${b.color}40` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Event Log */}
          <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
             <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
               <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>⚡ Activity Stream</h3>
             </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', padding: '8px 0' }}>
              {recentUpdates.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div className="loading-spinner" style={{ width: 24, height: 24, marginBottom: 12 }} />
                  Monitoring live signals...
                </div>
              ) : recentUpdates.map((u, i) => (
                <div key={i} className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < recentUpdates.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-light)' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{u.msg}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{u.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
