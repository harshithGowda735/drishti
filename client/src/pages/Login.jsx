import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
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
    { value: 'patient', label: '👤 Patient', desc: 'Book appointments & access records' },
    { value: 'hospital_admin', label: '🏥 Hospital Admin', desc: 'Manage hospital operations' },
    { value: 'asha_worker', label: '🌾 ASHA Worker', desc: 'Support rural healthcare' },
    { value: 'doctor', label: '⚕️ Doctor', desc: 'Manage patients & appointments' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: 20 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏥</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HealthConnect
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Smart Healthcare Platform</p>
        </div>

        <div className="card-glass" style={{ padding: 32 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            {['Login', 'Register'].map(t => (
              <button key={t} onClick={() => { setIsRegister(t === 'Register'); setError(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: 6, fontWeight: 600, fontSize: '0.9rem',
                  background: (t === 'Register') === isRegister ? 'var(--gradient-primary)' : 'transparent',
                  color: (t === 'Register') === isRegister ? 'white' : 'var(--text-secondary)' }}>
                {t}
              </button>
            ))}
          </div>

          {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <>
                <div className="input-group">
                  <label>Full Name</label>
                  <input className="input-field" placeholder="Enter your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input className="input-field" placeholder="10-digit phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                </div>
              </>
            )}
            <div className="input-group">
              <label>Email Address</label>
              <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>

            {isRegister && (
              <div className="input-group">
                <label>Select Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {roles.map(r => (
                    <button type="button" key={r.value} onClick={() => setForm({...form, role: r.value})}
                      style={{ padding: '10px 12px', borderRadius: 8, textAlign: 'left', fontSize: '0.82rem',
                        background: form.role === r.value ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
                        border: `1.5px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                        color: form.role === r.value ? 'var(--primary-light)' : 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 600 }}>{r.label}</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              style={{ marginTop: 8 }}>
              {loading ? '⏳ Please wait...' : isRegister ? '🚀 Create Account' : '🔑 Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Demo: Register with any email to get started
        </p>
      </div>
    </div>
  );
}
