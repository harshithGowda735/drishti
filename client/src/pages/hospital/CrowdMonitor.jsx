import { useState } from 'react';

export default function CrowdMonitor() {
  const [zones, setZones] = useState([
    { name: 'Main Entrance', count: 45, density: 'moderate', camera: 'CAM-01' },
    { name: 'Emergency Wing', count: 23, density: 'high', camera: 'CAM-02' },
    { name: 'OPD Area', count: 78, density: 'very_high', camera: 'CAM-03' },
    { name: 'Pharmacy', count: 12, density: 'low', camera: 'CAM-04' },
    { name: 'Lab Collection', count: 34, density: 'moderate', camera: 'CAM-05' },
    { name: 'Cafeteria', count: 8, density: 'low', camera: 'CAM-06' },
  ]);

  const densityConfig = {
    low: { color: '#10b981', label: 'Low', bg: 'rgba(16,185,129,0.15)' },
    moderate: { color: '#f59e0b', label: 'Moderate', bg: 'rgba(245,158,11,0.15)' },
    high: { color: '#ef4444', label: 'High', bg: 'rgba(239,68,68,0.15)' },
    very_high: { color: '#dc2626', label: 'Very High', bg: 'rgba(220,38,38,0.15)' }
  };

  const totalCount = zones.reduce((s, z) => s + z.count, 0);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>👥 Crowd Monitoring</h1>
        <p>OpenCV-powered real-time crowd density detection across hospital zones</p>
      </div>

      {/* Summary Bar */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total People Detected</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalCount}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {Object.entries(densityConfig).map(([key, conf]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: conf.color }} />
              <span style={{ color: 'var(--text-muted)' }}>{conf.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--success)' }}>Live Feed Active</span>
        </div>
      </div>

      {/* Zone Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {zones.map((zone, i) => {
          const conf = densityConfig[zone.density];
          return (
            <div key={i} className="card" style={{ borderColor: `${conf.color}30` }}>
              {/* Camera Simulation */}
              <div style={{
                background: '#0a0f1a', borderRadius: 8, padding: 40, textAlign: 'center', marginBottom: 16,
                position: 'relative', border: '1px solid var(--border)'
              }}>
                <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{zone.camera} • LIVE</span>
                </div>
                <div style={{ fontSize: '2.5rem', opacity: 0.5 }}>🎥</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>OpenCV Feed — {zone.name}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{zone.name}</h3>
                <span className="badge" style={{ background: conf.bg, color: conf.color }}>{conf.label}</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: 'var(--bg-surface)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: conf.color }}>{zone.count}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>People</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-surface)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                    {zone.density === 'low' ? '😊' : zone.density === 'moderate' ? '😐' : zone.density === 'high' ? '😰' : '🚨'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
