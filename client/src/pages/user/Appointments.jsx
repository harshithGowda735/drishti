import { useState, useEffect } from 'react';
import * as api from '../../services/api';

export default function Appointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.getMyAppointments();
      setAppointments(res.data);
    } catch { setAppointments([]); }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try { await api.cancelAppointment(id); fetchAppointments(); } catch {}
  };

  const statusColors = { pending: 'warning', confirmed: 'primary', in_progress: 'info', completed: 'success', cancelled: 'danger' };
  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>📅 My Appointments</h1>
        <p>View and manage your healthcare appointments</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner" /> : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📅</div><h3>No appointments found</h3><p style={{color:'var(--text-muted)'}}>Book your first appointment from the Hospital Finder</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(a => (
            <div key={a._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.2rem' }}>{a.type === 'emergency' ? '🚑' : '🏥'}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{a.hospital?.name || 'Hospital'}</h3>
                  <span className={`badge badge-${statusColors[a.status] || 'primary'}`}>{a.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>📋 {a.department}</span>
                  <span>📆 {new Date(a.date).toLocaleDateString()}</span>
                  <span>🕐 {a.timeSlot}</span>
                  {a.type === 'emergency' && <span className="badge badge-danger">Emergency</span>}
                </div>
                {a.symptoms?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {a.symptoms.map(s => <span key={s} className="badge badge-info">{s}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['pending', 'confirmed'].includes(a.status) && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleCancel(a._id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
