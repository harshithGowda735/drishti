import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard({ user }) {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, []);

  const quickActions = [
    { icon: '🏥', title: 'Find Hospital', desc: 'Smart search with AI', path: '/user/hospitals', color: '#6366f1' },
    { icon: '📅', title: 'Book Appointment', desc: 'Real-time slot booking', path: '/user/hospitals', color: '#06b6d4' },
    { icon: '🚑', title: 'Emergency', desc: 'One-click emergency help', path: '/user/emergency', color: '#ef4444' },
    { icon: '🧠', title: 'AI Analysis', desc: 'Upload & analyze reports', path: '/user/ai-analysis', color: '#10b981' },
    { icon: '📋', title: 'My Records', desc: 'View medical history', path: '/user/records', color: '#f59e0b' },
    { icon: '📅', title: 'Appointments', desc: 'View upcoming visits', path: '/user/appointments', color: '#8b5cf6' },
  ];

  const healthTips = [
    { icon: '💊', tip: 'Take medications on time', time: '8:00 AM' },
    { icon: '🥗', tip: 'Eat a balanced breakfast', time: '9:00 AM' },
    { icon: '🏃', tip: '30 min walk recommended', time: '6:00 PM' },
    { icon: '💤', tip: 'Sleep 7-8 hours tonight', time: '10:00 PM' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', padding: '32px 28px',
        marginBottom: 28, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{greeting} 👋</p>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0 8px' }}>{user?.name || 'Patient'}</h1>
          <p style={{ fontSize: '0.88rem', opacity: 0.8 }}>Welcome to your health dashboard. Stay healthy, stay informed.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        {quickActions.map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)}
            style={{
              background: 'var(--gradient-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '20px 16px', textAlign: 'left', cursor: 'pointer', transition: 'var(--transition)',
              display: 'flex', flexDirection: 'column', gap: 8
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              {a.icon}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.desc}</div>
          </button>
        ))}
      </div>

      {/* Health Reminders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>🔔 Today's Reminders</h2>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {healthTips.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                borderBottom: i < healthTips.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <span style={{ fontSize: '1.3rem' }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{t.tip}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.time}</div>
                </div>
                <span className="badge badge-info">Pending</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>📊 Health Summary</h2>
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'Normal', color: 'var(--success)' },
                { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'Normal', color: 'var(--success)' },
                { label: 'Blood Sugar', value: '98', unit: 'mg/dL', status: 'Normal', color: 'var(--success)' },
                { label: 'SpO2', value: '98', unit: '%', status: 'Normal', color: 'var(--success)' },
              ].map((v, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{v.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{v.value} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>{v.unit}</span></div>
                  <div style={{ fontSize: '0.72rem', color: v.color, fontWeight: 600, marginTop: 2 }}>● {v.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
