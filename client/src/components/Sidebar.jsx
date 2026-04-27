import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const role = user?.role;

  const patientLinks = [
    { to: '/user', icon: '🏠', label: 'Dashboard' },
    { to: '/user/hospitals', icon: '🏥', label: 'Find Hospital' },
    { to: '/user/appointments', icon: '📅', label: 'Appointments' },
    { to: '/user/records', icon: '📋', label: 'Medical Records' },
    { to: '/user/ai-analysis', icon: '🧠', label: 'AI Analysis' },
    { to: '/user/emergency', icon: '🚑', label: 'Emergency' },
  ];

  const hospitalLinks = [
    { to: '/hospital', icon: '📊', label: 'Dashboard' },
    { to: '/hospital/beds', icon: '🛏️', label: 'Bed Management' },
    { to: '/hospital/appointments', icon: '📥', label: 'Appointments' },
    { to: '/hospital/crowd', icon: '👥', label: 'Crowd Monitor' },
    { to: '/hospital/emergency', icon: '⚡', label: 'Emergencies' },
    { to: '/hospital/analytics', icon: '📈', label: 'Analytics' },
  ];

  const ashaLinks = [
    { to: '/asha', icon: '🏠', label: 'Dashboard' },
    { to: '/asha/patients', icon: '👥', label: 'Patients' },
    { to: '/asha/bookings', icon: '📅', label: 'Book for Patient' },
    { to: '/asha/schemes', icon: '📢', label: 'Gov Schemes' },
  ];

  const links = role === 'hospital_admin' || role === 'doctor' ? hospitalLinks : role === 'asha_worker' ? ashaLinks : patientLinks;

  const handleLogout = () => {
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 260, minHeight: '100vh', background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🏥</span>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HealthConnect</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {role === 'hospital_admin' ? 'Hospital Panel' : role === 'asha_worker' ? 'ASHA Panel' : 'Patient Portal'}
            </span>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to.split('/').length <= 2}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8,
              fontSize: '0.88rem', fontWeight: isActive ? 600 : 400, textDecoration: 'none',
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'var(--transition)'
            })}>
            <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline btn-block btn-sm">🚪 Logout</button>
      </div>
    </aside>
  );
}
