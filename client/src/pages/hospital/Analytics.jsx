import { useState, useEffect } from 'react';
import { gsap } from 'gsap';

export default function Analytics() {
  const [livePatients, setLivePatients] = useState(470);
  const [intakeLog, setIntakeLog] = useState([
    { id: 1, type: 'OPD', dept: 'Cardiology', time: 'Just now' },
    { id: 2, type: 'ER', dept: 'Emergency', time: '2m ago' },
    { id: 3, type: 'OPD', dept: 'General Medicine', time: '5m ago' },
  ]);

  const [deptLoads, setDeptLoads] = useState([
    { name: 'General Medicine', patients: 156, load: 78 },
    { name: 'Cardiology', patients: 89, load: 65 },
    { name: 'Orthopedics', patients: 67, load: 45 },
    { name: 'Pediatrics', patients: 93, load: 55 },
    { name: 'Emergency', patients: 120, load: 90 },
  ]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray('.card-glass, .card');
      if (bars.length > 0) {
        gsap.from(bars, { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
      }
    });

    const interval = setInterval(() => {
      setLivePatients(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setDeptLoads(prev => prev.map(d => ({
        ...d,
        load: Math.min(100, Math.max(10, d.load + (Math.random() > 0.5 ? 2 : -2))),
        patients: Math.max(1, d.patients + (Math.random() > 0.5 ? 1 : -1))
      })));

      if (Math.random() > 0.7) {
        const types = ['OPD', 'ER', 'Consultation'];
        const depts = ['Surgery', 'Cardiology', 'Pediatrics', 'Radiology'];
        const newLog = {
          id: Date.now(),
          type: types[Math.floor(Math.random() * types.length)],
          dept: depts[Math.floor(Math.random() * depts.length)],
          time: 'New'
        };
        setIntakeLog(prev => [newLog, ...prev.slice(0, 5)]);
      }
    }, 4000);

    return () => {
      ctx.revert();
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📈 Live Analytics</h1>
          <p>Global hospital performance & resource intelligence</p>
        </div>
        <div className="badge badge-success" style={{ padding: '8px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
          LIVE SYNC ACTIVE
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Real-time Counter Card */}
        <div className="card-glass" style={{ background: 'var(--gradient-primary)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginBottom: 10 }}>Total Daily Footfall</div>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{livePatients}</div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>+12% vs Yesterday</div>
        </div>

        {/* Live Intake Ticker */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 12 }}>⚡ Live Patient Intake</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {intakeLog.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, animation: log.time === 'New' ? 'slideInRight 0.4s ease' : 'none' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className={`badge badge-${log.type === 'ER' ? 'danger' : 'primary'}`} style={{ fontSize: '0.65rem' }}>{log.type}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.dept}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly chart (bar representation) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>📊 Patient Trends (Last 4 Months)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 200, padding: '0 20px' }}>
          {[
            { month: 'Jan', patients: 420, emergency: 35 },
            { month: 'Feb', patients: 380, emergency: 28 },
            { month: 'Mar', patients: 510, emergency: 42 },
            { month: 'Apr', patients: livePatients, emergency: 38 },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end', height: 160 }}>
                <div style={{ width: 24, height: `${(d.patients / 600) * 160}px`, background: 'var(--gradient-primary)', borderRadius: '6px 6px 0 0', transition: 'height 1s ease' }} />
                <div style={{ width: 24, height: `${(d.emergency / 50) * 160}px`, background: 'var(--gradient-danger)', borderRadius: '6px 6px 0 0', transition: 'height 1s ease' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>{d.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Load */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>🏥 Real-time Department Load</h3>
        {deptLoads.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < deptLoads.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 140, fontSize: '0.9rem', fontWeight: 700 }}>{d.name}</div>
            <div style={{ flex: 1 }}>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${d.load}%`, background: d.load > 85 ? 'var(--danger)' : d.load > 65 ? 'var(--warning)' : 'var(--success)', transition: 'width 2s ease' }} />
              </div>
            </div>
            <div style={{ width: 60, textAlign: 'right', fontSize: '0.9rem', fontWeight: 800, color: d.load > 85 ? 'var(--danger)' : 'var(--text-primary)' }}>{Math.round(d.load)}%</div>
            <div style={{ width: 80, textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.patients} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}
