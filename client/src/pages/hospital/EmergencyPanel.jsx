import { useState, useEffect } from 'react';
import { getSocket, joinHospitalRoom, leaveHospitalRoom } from '../../services/socket';

export default function EmergencyPanel({ user }) {
  const [emergencies, setEmergencies] = useState([
    { id: 1, patient: 'Amit Patel', age: 45, symptoms: ['Chest Pain', 'Breathing Difficulty'], time: '5 min ago', status: 'active', bed: 'E-03', doctor: null },
    { id: 2, patient: 'Ravi Singh', age: 32, symptoms: ['Accident', 'Head Injury'], time: '12 min ago', status: 'active', bed: 'E-07', doctor: 'Dr. Sarah Wilson' },
    { id: 3, patient: 'Lakshmi N.', age: 68, symptoms: ['Stroke Symptoms', 'Paralysis'], time: '25 min ago', status: 'stabilized', bed: 'ICU-02', doctor: null },
  ]);

  const [availableDoctors] = useState([
    { id: 'd1', name: 'Dr. Sarah Wilson', dept: 'Cardiology' },
    { id: 'd2', name: 'Dr. James Bond', dept: 'Surgery' },
    { id: 'd3', name: 'Dr. Emily Blunt', dept: 'Pediatrics' },
  ]);

  const [showAssign, setShowAssign] = useState(null); // ID of emergency being assigned

  useEffect(() => {
    const hId = user?.hospitalId || 'hospital_1'; 
    joinHospitalRoom(hId);
    const socket = getSocket();

    socket.on('emergency_alert', (data) => {
      const newEmergency = {
        id: Date.now(),
        patient: data.patientName,
        age: 28,
        symptoms: [data.symptoms],
        time: 'Just Now',
        status: 'active',
        bed: 'Triage',
        doctor: null
      };
      setEmergencies(prev => [newEmergency, ...prev]);
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch {}
    });

    return () => { socket.off('emergency_alert'); leaveHospitalRoom(hId); };
  }, [user?.hospitalId]);

  const handleAssignDoctor = (emergencyId, doctorName) => {
    setEmergencies(prev => prev.map(e => e.id === emergencyId ? { ...e, doctor: doctorName } : e));
    setShowAssign(null);
  };

  const handleRemoveDoctor = (emergencyId) => {
    setEmergencies(prev => prev.map(e => e.id === emergencyId ? { ...e, doctor: null } : e));
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>⚡ Emergency Prioritization</h1>
        <p>Active emergencies sorted by criticality — assign specialized staff</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {emergencies.map((e) => (
          <div key={e.id} className="card" style={{ borderLeft: `6px solid ${e.status === 'active' ? 'var(--danger)' : 'var(--warning)'}`, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>{e.status === 'active' ? '🔴' : '🟡'}</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>{e.patient}</h3>
                  <span className={`badge badge-${e.status === 'active' ? 'danger' : 'warning'}`}>{e.status}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {e.time}</span>
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Age: {e.age} • Bed: <strong>{e.bed}</strong>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {e.symptoms.map(s => <span key={s} className="badge badge-danger" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>{s}</span>)}
                </div>
              </div>

              {/* Doctor Details / Assignment */}
              <div style={{ minWidth: 240, textAlign: 'right' }}>
                {e.doctor ? (
                  <div className="card-glass" style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid var(--success)', background: 'rgba(16,185,129,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Assigned Doctor</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>👨‍⚕️</div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{e.doctor}</div>
                        <button 
                          onClick={() => handleRemoveDoctor(e.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.72rem', padding: 0, cursor: 'pointer', fontWeight: 700 }}
                        >✕ Unassign Doctor</button>
                      </div>
                    </div>
                  </div>
                ) : showAssign === e.id ? (
                  <div className="card-glass animate-fade-in" style={{ padding: 10 }}>
                    <select 
                      className="input-field" 
                      style={{ padding: '4px 8px', fontSize: '0.85rem', marginBottom: 6 }}
                      onChange={(ev) => handleAssignDoctor(e.id, ev.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Doctor...</option>
                      {availableDoctors.map(d => <option key={d.id} value={d.name}>{d.name} ({d.dept})</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm btn-block" onClick={() => setShowAssign(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-danger" onClick={() => setShowAssign(e.id)}>
                    🚑 Assign Specialist
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
