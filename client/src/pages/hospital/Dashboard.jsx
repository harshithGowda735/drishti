import { useState, useEffect } from 'react';

export default function HospitalDashboard({ user }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  const stats = [
    { icon: '🛏️', value: '385', label: 'Total Beds', change: '+5 today', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { icon: '✅', value: '120', label: 'Available', change: '31%', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { icon: '📥', value: '47', label: 'Today Appointments', change: '+12 new', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    { icon: '🚨', value: '3', label: 'Emergencies', change: 'Active now', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    { icon: '👥', value: '145', label: 'Crowd Count', change: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { icon: '⭐', value: '4.3', label: 'Rating', change: '↑ 0.2', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ];

  const recentPatients = [
    { name: 'Rajesh Kumar', dept: 'Cardiology', time: '10:30 AM', status: 'In Progress', priority: 'high' },
    { name: 'Priya Sharma', dept: 'General Medicine', time: '11:00 AM', status: 'Waiting', priority: 'normal' },
    { name: 'Amit Patel', dept: 'Emergency', time: '11:15 AM', status: 'Critical', priority: 'emergency' },
    { name: 'Sunita Devi', dept: 'Pediatrics', time: '11:30 AM', status: 'Confirmed', priority: 'normal' },
    { name: 'Mohammed Ali', dept: 'Orthopedics', time: '12:00 PM', status: 'Waiting', priority: 'normal' },
  ];

  const priorityColors = { emergency: 'danger', high: 'warning', normal: 'primary' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📊 Hospital Dashboard</h1>
          <p>Real-time overview of hospital operations</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-light)' }}>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: '0.72rem', color: s.color }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>📥 Recent Patient Requests</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Patient</th><th>Department</th><th>Time</th><th>Status</th><th>Priority</th></tr></thead>
              <tbody>
                {recentPatients.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.dept}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.time}</td>
                    <td><span className={`badge badge-${p.status === 'Critical' ? 'danger' : p.status === 'In Progress' ? 'info' : p.status === 'Confirmed' ? 'success' : 'warning'}`}>{p.status}</span></td>
                    <td><span className={`badge badge-${priorityColors[p.priority]}`}>{p.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>🛏️ Bed Overview</h3>
          <div className="card">
            {[
              { label: 'General Ward', used: 265, total: 350, color: 'var(--primary)' },
              { label: 'ICU', used: 38, total: 50, color: 'var(--danger)' },
              { label: 'Emergency', used: 77, total: 100, color: 'var(--warning)' }
            ].map((b, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{b.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{b.used}/{b.total} occupied</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${(b.used/b.total)*100}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
