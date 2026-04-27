import { useState, useEffect } from 'react';
import { getSocket, joinHospitalRoom, leaveHospitalRoom } from '../../services/socket';
import * as api from '../../services/api';
// updateBedRealtime = PUT /api/crowd/:hospitalId/beds

const WARD_ICONS = { general: '🛏️', icu: '🏥', emergency: '🚑', pediatric: '👶', maternity: '🤱' };

export default function BedManagement({ user }) {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // ward being updated
  const [isConnected, setIsConnected] = useState(false);
  const [log, setLog] = useState([]);

  useEffect(() => { loadHospital(); }, [user?.hospitalId]);

  const loadHospital = async () => {
    try {
      const hId = user?.hospitalId;
      let h;
      if (hId) {
        const res = await api.getHospital(hId);
        h = res.data;
      } else {
        const res = await api.getHospitals();
        h = res.data[0];
      }
      setHospital(h);
    } catch {}
    setLoading(false);
  };

  // Socket.io for real-time bed updates pushed by other terminals
  useEffect(() => {
    const hId = hospital?._id;
    if (!hId) return;

    const socket = getSocket();
    joinHospitalRoom(hId);
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    setIsConnected(socket.connected);

    socket.on('beds_update', (data) => {
      if (data.hospitalId !== hId) return;
      setHospital(prev => prev ? { ...prev, beds: data.beds } : prev);
      addLog(`${data.ward} ward: ${data.action === 'admit' ? '🔴 Patient admitted' : '🟢 Patient discharged'}`);
    });

    return () => {
      leaveHospitalRoom(hId);
      socket.off('beds_update');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [hospital?._id]);

  const addLog = (msg) => setLog(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 14)]);

  const handleBedAction = async (ward, action) => {
    if (!hospital?._id) return;
    setUpdating(ward + action);
    try {
      const res = await api.updateBedRealtime(hospital._id, { ward, action });
      setHospital(prev => prev ? { ...prev, beds: res.data.beds } : prev);
      addLog(`${ward} ward: ${action === 'admit' ? '🔴 Admitted' : '🟢 Discharged'}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
    setUpdating(null);
  };

  if (loading) return <div className="loading-spinner" />;

  const beds = hospital?.beds || {};

  const wards = [
    { key: 'general',   label: 'General Ward',   total: beds.general?.total || 0,   avail: beds.general?.available || 0 },
    { key: 'icu',       label: 'ICU',             total: beds.icu?.total || 0,        avail: beds.icu?.available || 0 },
    { key: 'emergency', label: 'Emergency',       total: beds.emergency?.total || 0,  avail: beds.emergency?.available || 0 },
  ];

  const totBeds  = wards.reduce((s, w) => s + w.total, 0);
  const totAvail = wards.reduce((s, w) => s + w.avail, 0);
  const totOcc   = totBeds - totAvail;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>🛏️ Bed Management</h1>
          <p>Real-time bed availability — updates broadcast instantly via Socket.io</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? '#10b981' : '#ef4444', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isConnected ? '#10b981' : '#ef4444' }}>{isConnected ? 'Live Sync' : 'Offline'}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Beds', value: totBeds,  color: 'var(--primary)' },
          { label: 'Available',  value: totAvail, color: 'var(--success)' },
          { label: 'Occupied',   value: totOcc,   color: 'var(--warning)' },
          { label: 'Occupancy',  value: totBeds > 0 ? Math.round((totOcc / totBeds) * 100) + '%' : '—', color: totOcc / totBeds > 0.8 ? 'var(--danger)' : 'var(--text-primary)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Ward Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {wards.map(w => {
            const occ = w.total - w.avail;
            const pct = w.total > 0 ? (occ / w.total) * 100 : 0;
            const color = pct > 85 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={w.key} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>{WARD_ICONS[w.key]}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{w.label}</h3>
                  </div>
                  <span className={`badge badge-${pct > 85 ? 'danger' : pct > 60 ? 'warning' : 'success'}`}>{Math.round(pct)}% full</span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 14 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {[['Total', w.total, 'var(--text-primary)'], ['Available', w.avail, 'var(--success)'], ['Occupied', occ, 'var(--warning)']].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ textAlign: 'center', padding: 10, background: 'var(--bg-surface)', borderRadius: 8 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: col }}>{val}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                    disabled={w.avail === 0 || updating === w.key + 'admit'}
                    onClick={() => handleBedAction(w.key, 'admit')}>
                    {updating === w.key + 'admit' ? '⏳...' : '+ Admit Patient'}
                  </button>
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }}
                    disabled={occ === 0 || updating === w.key + 'discharge'}
                    onClick={() => handleBedAction(w.key, 'discharge')}>
                    {updating === w.key + 'discharge' ? '⏳...' : '− Discharge'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Log */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>📋 Action Log</h3>
          <div className="card" style={{ padding: '8px 0', maxHeight: 500, overflowY: 'auto' }}>
            {log.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No actions yet</div>
            ) : log.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none', animation: i === 0 ? 'fadeIn 0.3s ease' : 'none' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{l.msg}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
