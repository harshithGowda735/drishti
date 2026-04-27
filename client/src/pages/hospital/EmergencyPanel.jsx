import { useState } from 'react';

export default function EmergencyPanel() {
  const [emergencies] = useState([
    { id: 1, patient: 'Amit Patel', age: 45, symptoms: ['Chest Pain', 'Breathing Difficulty'], time: '5 min ago', status: 'active', bed: 'E-03' },
    { id: 2, patient: 'Ravi Singh', age: 32, symptoms: ['Accident', 'Head Injury'], time: '12 min ago', status: 'active', bed: 'E-07' },
    { id: 3, patient: 'Lakshmi N.', age: 68, symptoms: ['Stroke Symptoms', 'Paralysis'], time: '25 min ago', status: 'stabilized', bed: 'ICU-02' },
  ]);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header"><h1>⚡ Emergency Prioritization</h1><p>Active emergencies sorted by criticality</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {emergencies.map((e, i) => (
          <div key={e.id} className="card" style={{ borderLeft: `4px solid ${e.status === 'active' ? 'var(--danger)' : 'var(--warning)'}`, borderColor: e.status === 'active' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>{e.status === 'active' ? '🔴' : '🟡'}</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{e.patient}</h3>
                  <span className={`badge badge-${e.status === 'active' ? 'danger' : 'warning'}`}>{e.status}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {e.time}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Age: {e.age} • Bed: {e.bed}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {e.symptoms.map(s => <span key={s} className="badge badge-danger">{s}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger btn-sm">🚑 Assign Doctor</button>
                <button className="btn btn-outline btn-sm">📋 Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
