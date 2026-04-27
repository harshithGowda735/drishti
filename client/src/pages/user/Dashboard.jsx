import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

export default function UserDashboard({ user }) {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const bannerRef = useRef(null);
  const actionsRef = useRef(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { force3D: true } });
      tl.fromTo(bannerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' })
        .fromTo(actionsRef.current?.children || [], { y: 15, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.35, ease: 'power2.out' }, '-=0.25')
        .fromTo(summaryRef.current?.children || [], { y: 15, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    });
    return () => ctx.revert();
  }, []);

  const quickActions = [
    { icon: '🏥', title: 'Find Hospital', desc: 'Smart search with AI', path: '/user/hospitals', color: '#6366f1' },
    { icon: '📅', title: 'Book Appointment', desc: 'Real-time slot booking', path: '/user/hospitals', color: '#06b6d4' },
    { icon: '🚑', title: 'Emergency', desc: 'One-click SOS help', path: '/user/emergency', color: '#ef4444' },
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
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      {/* Welcome Banner */}
      <div ref={bannerRef} className="card-glass" style={{
        background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', padding: '32px 28px',
        marginBottom: 28, position: 'relative', overflow: 'hidden', border: 'none'
      }}>
        <div className="float-anim" style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div className="float-anim-rev" style={{ position: 'absolute', bottom: -40, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, fontWeight: 600 }}>{greeting} 👋</p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '4px 0 8px', color: '#fff' }}>{user?.name || 'Patient'}</h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Welcome to your health dashboard. Your health, our priority.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--accent)' }}>⚡</span> Quick Actions
      </h2>
      <div ref={actionsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        {quickActions.map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)}
            className="card"
            style={{
              textAlign: 'left', cursor: 'pointer', transition: 'var(--transition)',
              display: 'flex', flexDirection: 'column', gap: 10, borderBottom: `3px solid ${a.color}40`
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: a.color }}>
              {a.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{a.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Two Column Section */}
      <div ref={summaryRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Reminders */}
        <div className="stagger">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--primary-light)' }}>🔔</span> Today's Reminders
          </h2>
          <div className="card" style={{ padding: '0 20px' }}>
            {healthTips.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0',
                borderBottom: i < healthTips.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ fontSize: '1.5rem', background: 'var(--bg-surface)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.tip}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.time}</div>
                </div>
                <span className="badge badge-info" style={{ borderRadius: 6 }}>Upcoming</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Summary */}
        <div className="stagger">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--success)' }}>📊</span> Health Summary
          </h2>
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {[
                { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'Normal', color: 'var(--success)', icon: '🩺' },
                { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'Normal', color: 'var(--success)', icon: '❤️' },
                { label: 'Blood Sugar', value: '98', unit: 'mg/dL', status: 'Normal', color: 'var(--success)', icon: '🩸' },
                { label: 'SpO2', value: '98', unit: '%', status: 'Normal', color: 'var(--success)', icon: '🫁' },
              ].map((v, i) => (
                <div key={i} style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '1.1rem' }}>{v.icon}</span>
                    <span style={{ fontSize: '0.65rem', color: v.color, fontWeight: 700, textTransform: 'uppercase' }}>{v.status}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{v.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                    {v.value} 
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-sm btn-block" style={{ marginTop: 16 }}>View Detailed History</button>
          </div>
        </div>
      </div>
    </div>
  );
}
