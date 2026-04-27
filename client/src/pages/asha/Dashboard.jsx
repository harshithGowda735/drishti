import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AshaDashboard({ user }) {
  const navigate = useNavigate();
  const stats = [
    { icon: '👥', value: '24', label: 'Assigned Patients', color: '#6366f1' },
    { icon: '📅', value: '8', label: 'Bookings This Week', color: '#06b6d4' },
    { icon: '📢', value: '5', label: 'Scheme Applications', color: '#10b981' },
    { icon: '🏥', value: '3', label: 'Hospital Visits', color: '#f59e0b' },
  ];

  const recentPatients = [
    { name: 'Kamala Devi', age: 45, village: 'Hosahalli', condition: 'Diabetes', lastVisit: '2 days ago', status: 'follow_up' },
    { name: 'Lakshmi Bai', age: 32, village: 'Kempura', condition: 'Pregnancy (7mo)', lastVisit: '1 week ago', status: 'routine' },
    { name: 'Raju Gowda', age: 60, village: 'Hosahalli', condition: 'Hypertension', lastVisit: '3 days ago', status: 'medication' },
    { name: 'Savitha R.', age: 28, village: 'Belur', condition: 'Anemia', lastVisit: 'Yesterday', status: 'follow_up' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>🌾 ASHA Worker Portal</p>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0' }}>{user?.name || 'ASHA Worker'}</h1>
        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Empowering rural healthcare delivery</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>👥 Recent Patients</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentPatients.map((p, i) => (
              <div key={i} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/asha/patients')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({p.age}y)</span></div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {p.village} • {p.condition}</div>
                  </div>
                  <span className={`badge badge-${p.status === 'follow_up' ? 'warning' : p.status === 'medication' ? 'primary' : 'success'}`}>{p.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📅', title: 'Book for Patient', desc: 'Assist with hospital booking', path: '/asha/bookings', color: '#6366f1' },
              { icon: '📢', title: 'Government Schemes', desc: 'Suggest eligible schemes', path: '/asha/schemes', color: '#10b981' },
              { icon: '👥', title: 'View All Patients', desc: 'Access patient records', path: '/asha/patients', color: '#06b6d4' },
            ].map((a, i) => (
              <button key={i} className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}
                onClick={() => navigate(a.path)}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{a.icon}</div>
                <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.desc}</div></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
