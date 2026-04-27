import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

export default function AshaDashboard({ user }) {
  const navigate  = useNavigate();
  const heroRef   = useRef(null);
  const statsRef  = useRef(null);
  const actionsRef= useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(heroRef.current,  { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        .fromTo(statsRef.current?.children || [], { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .fromTo(actionsRef.current?.children || [], { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    });
    return () => ctx.revert();
  }, []);

  const stats = [
    { icon: '👥', value: '24', label: 'Patients',    color: '#6366f1' },
    { icon: '📅', value: '8',  label: 'This Week',   color: '#06b6d4' },
    { icon: '📢', value: '5',  label: 'Applications', color: '#10b981' },
    { icon: '🏥', value: '3',  label: 'Visits',       color: '#f59e0b' },
  ];

  const recentPatients = [
    { name: 'Kamala Devi', age: 45, village: 'Hosahalli', condition: 'Diabetes',          lastVisit: '2 days ago', status: 'follow_up' },
    { name: 'Lakshmi Bai', age: 32, village: 'Kempura',   condition: 'Pregnancy (7mo)',    lastVisit: '1 week ago', status: 'routine'   },
    { name: 'Raju Gowda',  age: 60, village: 'Hosahalli', condition: 'Hypertension',       lastVisit: '3 days ago', status: 'medication' },
    { name: 'Savitha R.',  age: 28, village: 'Belur',     condition: 'Anemia',             lastVisit: 'Yesterday',  status: 'follow_up' },
  ];

  const actions = [
    { icon: '📅', title: 'Book for Patient',   desc: 'Hospital appointment booking', path: '/asha/bookings', color: '#6366f1' },
    { icon: '📢', title: 'Government Schemes', desc: 'Suggest & apply schemes',       path: '/asha/schemes',  color: '#10b981' },
    { icon: '👥', title: 'My Patients',        desc: 'View all assigned patients',    path: '/asha/patients', color: '#06b6d4' },
  ];

  const statusColor = { follow_up: 'warning', routine: 'success', medication: 'info' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', position: 'relative', zIndex: 1 }}>
      {/* Hero banner */}
      <div ref={heroRef} style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', borderRadius: 'var(--radius-lg)', padding: '22px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} className="float-anim-slow" />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} className="float-anim-rev" />
        <p style={{ fontSize: '0.78rem', opacity: 0.85, fontWeight: 600 }}>🌾 ASHA WORKER PORTAL</p>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '4px 0', position: 'relative', zIndex: 1 }}>{user?.name || 'ASHA Worker'}</h1>
        <p style={{ fontSize: '0.82rem', opacity: 0.8 }}>Empowering rural healthcare, one patient at a time</p>
      </div>

      {/* Stats */}
      <div ref={statsRef} className="grid-4" style={{ marginBottom: 20 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderBottom: `3px solid ${s.color}` }}>
            <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column (stacks on mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
        {/* Recent patients */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>👥 Recent Patients</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentPatients.map((p, i) => (
              <div key={i} className="card" style={{ cursor: 'pointer', padding: 14, transition: 'var(--transition)' }}
                onClick={() => navigate('/asha/patients')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{p.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.name} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>({p.age}y)</span></div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>📍 {p.village} · {p.condition}</div>
                    </div>
                  </div>
                  <span className={`badge badge-${statusColor[p.status] || 'primary'}`}>{p.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>⚡ Quick Actions</h3>
          <div ref={actionsRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {actions.map((a, i) => (
              <button key={i} className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: 18, display: 'flex', alignItems: 'center', gap: 14, background: `linear-gradient(135deg, var(--bg-card), ${a.color}08)`, borderLeft: `3px solid ${a.color}` }}
                onClick={() => navigate(a.path)}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{a.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '1rem' }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
