import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = {
  patient: [
    { path: '/user',              icon: '🏠', label: 'Home' },
    { path: '/user/hospitals',    icon: '🔍', label: 'Hospitals' },
    { path: '/user/appointments', icon: '📅', label: 'Bookings' },
    { path: '/user/records',      icon: '📋', label: 'Records' },
    { path: '/user/ai-analysis',  icon: '🧠', label: 'AI' },
    { path: '/user/emergency',    icon: '🚨', label: 'SOS' },
  ],
  hospital_admin: [
    { path: '/hospital',              icon: '📊', label: 'Dashboard' },
    { path: '/hospital/beds',         icon: '🛏️',  label: 'Beds' },
    { path: '/hospital/appointments', icon: '📅', label: 'Appts' },
    { path: '/hospital/crowd',        icon: '👥', label: 'Crowd' },
    { path: '/hospital/emergency',    icon: '🚑', label: 'Emergency' },
    { path: '/hospital/analytics',    icon: '📈', label: 'Analytics' },
  ],
  doctor: [
    { path: '/hospital',              icon: '📊', label: 'Dashboard' },
    { path: '/hospital/beds',         icon: '🛏️',  label: 'Beds' },
    { path: '/hospital/appointments', icon: '📅', label: 'Appts' },
    { path: '/hospital/emergency',    icon: '🚑', label: 'Emergency' },
    { path: '/hospital/analytics',    icon: '📈', label: 'Analytics' },
  ],
  asha_worker: [
    { path: '/asha',          icon: '🏠', label: 'Home' },
    { path: '/asha/patients', icon: '👥', label: 'Patients' },
    { path: '/asha/bookings', icon: '📅', label: 'Book' },
    { path: '/asha/schemes',  icon: '📢', label: 'Schemes' },
  ],
};

const roleLabels = {
  patient:       { label: 'PATIENT PORTAL',  color: 'var(--primary)' },
  hospital_admin:{ label: 'HOSPITAL PANEL',  color: 'var(--secondary)' },
  doctor:        { label: 'DOCTOR PANEL',    color: 'var(--success)' },
  asha_worker:   { label: 'ASHA WORKER',     color: '#10b981' },
};

export default function Sidebar({ user, onLogout }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth <= 768);

  const role  = user?.role || 'patient';
  const items = navItems[role] || navItems.patient;
  // Bottom nav shows max 5 items on mobile
  const bottomItems = items.slice(0, 5);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close sidebar when navigating (mobile)
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) =>
    path === '/user' || path === '/hospital' || path === '/asha'
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const rl = roleLabels[role] || roleLabels.patient;

  // ── DESKTOP SIDEBAR ──────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🏥</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>HealthConnect</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: rl.color }}>{rl.label}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <button key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 12, width: '100%', textAlign: 'left',
              background: isActive(item.path) ? 'rgba(99,102,241,0.2)' : 'transparent',
              borderLeft: isActive(item.path) ? '4px solid var(--primary-light)' : '4px solid transparent',
              color: isActive(item.path) ? '#fff' : 'var(--text-secondary)',
              fontWeight: isActive(item.path) ? 800 : 500,
              fontSize: '0.9rem',
              transition: 'var(--transition)',
              boxShadow: isActive(item.path) ? '0 4px 12px rgba(99,102,241,0.1)' : 'none',
            }}>
            <span style={{ fontSize: '1.25rem', width: 24, textAlign: 'center', filter: isActive(item.path) ? 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' : 'none' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-outline btn-block btn-sm" onClick={onLogout}>🚪 Logout</button>
      </div>
    </div>
  );

  // ── MOBILE BOTTOM NAV ─────────────────────────────────────────────────
  const BottomNav = () => (
    <nav className="bottom-nav">
      {bottomItems.map((item) => (
        <button key={item.path}
          className={`bottom-nav-item${isActive(item.path) ? ' active' : ''}`}
          onClick={() => navigate(item.path)}>
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      {/* Profile/Menu button */}
      <button className="bottom-nav-item" onClick={() => setMobileOpen(true)}>
        <span className="nav-icon">👤</span>
        <span>More</span>
      </button>
    </nav>
  );

  // ── MOBILE SIDEBAR OVERLAY ─────────────────────────────────────────────
  const MobileMenu = () => mobileOpen ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => setMobileOpen(false)} />
      {/* Drawer */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', zIndex: 1, animation: 'slideInLeft 0.3s ease', display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && <SidebarContent />}
      {/* Mobile */}
      {isMobile && <BottomNav />}
      {isMobile && <MobileMenu />}
    </>
  );
}
