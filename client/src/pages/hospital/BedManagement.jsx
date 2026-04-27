import { useState } from 'react';

export default function BedManagement() {
  const [beds, setBeds] = useState({
    general: { total: 350, available: 85, occupied: 265 },
    icu: { total: 50, available: 12, occupied: 38 },
    emergency: { total: 100, available: 23, occupied: 77 },
    pediatric: { total: 60, available: 18, occupied: 42 },
    maternity: { total: 40, available: 15, occupied: 25 }
  });

  const updateBed = (ward, action) => {
    setBeds(prev => {
      const w = { ...prev[ward] };
      if (action === 'admit' && w.available > 0) { w.available--; w.occupied++; }
      if (action === 'discharge' && w.occupied > 0) { w.available++; w.occupied--; }
      return { ...prev, [ward]: w };
    });
  };

  const wardIcons = { general: '🛏️', icu: '🏥', emergency: '🚑', pediatric: '👶', maternity: '🤱' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>🛏️ Bed Management</h1>
        <p>Real-time bed availability tracking and management</p>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Beds', value: Object.values(beds).reduce((s, w) => s + w.total, 0), color: 'var(--primary)' },
          { label: 'Available', value: Object.values(beds).reduce((s, w) => s + w.available, 0), color: 'var(--success)' },
          { label: 'Occupied', value: Object.values(beds).reduce((s, w) => s + w.occupied, 0), color: 'var(--warning)' },
          { label: 'Occupancy', value: Math.round((Object.values(beds).reduce((s, w) => s + w.occupied, 0) / Object.values(beds).reduce((s, w) => s + w.total, 0)) * 100) + '%', color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ward Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {Object.entries(beds).map(([key, ward]) => {
          const pct = (ward.occupied / ward.total) * 100;
          const color = pct > 85 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--success)';
          return (
            <div key={key} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.5rem' }}>{wardIcons[key]}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize' }}>{key} Ward</h3>
                </div>
                <span className={`badge ${pct > 85 ? 'badge-danger' : pct > 60 ? 'badge-warning' : 'badge-success'}`}>
                  {Math.round(pct)}% full
                </span>
              </div>

              <div className="progress-bar" style={{ marginBottom: 16 }}>
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-surface)', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{ward.total}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-surface)', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>{ward.available}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Available</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-surface)', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--warning)' }}>{ward.occupied}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Occupied</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => updateBed(key, 'admit')}>+ Admit</button>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => updateBed(key, 'discharge')}>− Discharge</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
