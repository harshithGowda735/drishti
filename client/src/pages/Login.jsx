import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { login, register } from '../services/api';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm]   = useState({ name: '', email: '', password: '', phone: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const orb1Ref   = useRef(null);
  const orb2Ref   = useRef(null);
  const orb3Ref   = useRef(null);
  const cardRef   = useRef(null);

  // GSAP floating orbs + card entrance
  useEffect(() => {
    gsap.to(orb1Ref.current, { y: -30, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', force3D: true });
    gsap.to(orb2Ref.current, { y: 25,  duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1, force3D: true });
    gsap.to(orb3Ref.current, { y: -18, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5, force3D: true });
    
    // Use fromTo to prevent React StrictMode double-fire bug causing opacity to stick at 0
    gsap.fromTo(cardRef.current, 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', force3D: true }
    );
  }, []);

  // Shake animation for error box when it appears
  useEffect(() => {
    if (error) {
      gsap.fromTo('.error-box', { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Button press micro-animation
    gsap.from('.submit-btn', { scale: 0.97, duration: 0.15 });
    try {
      const res = isRegister ? await register(form) : await login({ email: form.email, password: form.password });
      localStorage.setItem('user', JSON.stringify(res.data));
      onLogin(res.data);
      const routes = { patient: '/user', hospital_admin: '/hospital', asha_worker: '/asha', doctor: '/hospital' };
      navigate(routes[res.data.role] || '/user');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const roles = [
    { value: 'patient',       label: '👤 Patient',      desc: 'Book appointments & access records' },
    { value: 'hospital_admin',label: '🏥 Hospital Admin',desc: 'Manage hospital operations' },
    { value: 'asha_worker',   label: '🌾 ASHA Worker',  desc: 'Support rural healthcare' },
    { value: 'doctor',        label: '⚕️ Doctor',        desc: 'Manage patients & appointments' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: '20px 16px', position: 'relative', overflow: 'hidden' }}>
      {/* GSAP floating orbs */}
      <div ref={orb1Ref} style={{ position: 'fixed', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', top: '-120px', right: '-80px', pointerEvents: 'none' }} />
      <div ref={orb2Ref} style={{ position: 'fixed', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)', bottom: '-180px', left: '-120px', pointerEvents: 'none' }} />
      <div ref={orb3Ref} style={{ position: 'fixed', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', top: '45%', left: '20%', pointerEvents: 'none' }} />

      <div ref={cardRef} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3.2rem', marginBottom: 12, filter: 'drop-shadow(0 0 25px rgba(99,102,241,0.6))', display: 'inline-block' }} className="float-anim">🏥</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            HealthConnect
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>Smart Healthcare Platform</p>
        </div>

        <div className="card-glass" style={{ padding: '28px 24px' }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
            {['Login', 'Register'].map(t => (
              <button key={t} onClick={() => { setIsRegister(t === 'Register'); setError(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', transition: 'var(--transition)',
                  background: (t === 'Register') === isRegister ? 'var(--gradient-primary)' : 'transparent',
                  color: (t === 'Register') === isRegister ? '#fff' : 'var(--text-secondary)',
                  boxShadow: (t === 'Register') === isRegister ? '0 4px 14px rgba(99,102,241,0.35)' : 'none' }}>
                {t}
              </button>
            ))}
          </div>

          {error && (
            <div className="error-box" style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isRegister && (
              <>
                <div className="input-group">
                  <label>Full Name</label>
                  <input className="input-field" placeholder="Enter your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input className="input-field" placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required inputMode="tel" />
                </div>
              </>
            )}
            <div className="input-group">
              <label>Email Address</label>
              <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required inputMode="email" autoComplete="email" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required autoComplete={isRegister ? 'new-password' : 'current-password'} />
            </div>

            {isRegister && (
              <div className="input-group">
                <label>Select Role</label>
                <div className="grid-2">
                  {roles.map(r => (
                    <button type="button" key={r.value} onClick={() => setForm({...form, role: r.value})}
                      style={{ padding: '10px 12px', borderRadius: 8, textAlign: 'left', fontSize: '0.82rem', transition: 'var(--transition)',
                        background: form.role === r.value ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
                        border: `1.5px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                        color: form.role === r.value ? 'var(--primary-light)' : 'var(--text-secondary)',
                        transform: form.role === r.value ? 'scale(1.02)' : 'scale(1)' }}>
                      <div style={{ fontWeight: 700 }}>{r.label}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg submit-btn" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? '⏳ Please wait...' : isRegister ? '🚀 Create Account' : '🔑 Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Demo: Register with any email to get started
        </p>
      </div>
    </div>
  );
}
