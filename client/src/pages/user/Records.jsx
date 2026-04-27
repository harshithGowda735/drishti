import { useState, useEffect } from 'react';
import * as api from '../../services/api';

export default function MedicalRecords({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      api.getPatientRecords(user._id).then(r => setRecords(r.data)).catch(() => setRecords([])).finally(() => setLoading(false));
    } else setLoading(false);
  }, [user]);

  const typeIcons = { lab_report: '🧪', prescription: '💊', imaging: '🩻', discharge_summary: '📄', vaccination: '💉', surgery: '🔬', other: '📋' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>📋 Medical Records</h1>
        <p>Your centralized health data — no repetition needed</p>
      </div>
      {loading ? <div className="loading-spinner" /> : records.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📋</div><h3>No records yet</h3><p style={{color:'var(--text-muted)'}}>Your medical records will appear here after appointments</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {records.map(r => (
            <div key={r._id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '1.5rem' }}>{typeIcons[r.type] || '📋'}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{r.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()} • {r.hospital?.name}</p>
                </div>
                <span className={`badge badge-${r.type === 'lab_report' ? 'primary' : 'info'}`}>{r.type?.replace('_', ' ')}</span>
              </div>
              {r.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{r.description}</p>}
              {r.aiAnalysis && (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 14, marginTop: 8 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: 6 }}>🧠 AI Analysis</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.aiAnalysis.summary}</p>
                  {r.aiAnalysis.riskLevel && <span className={`badge badge-${r.aiAnalysis.riskLevel === 'low' ? 'success' : r.aiAnalysis.riskLevel === 'high' ? 'danger' : 'warning'}`} style={{marginTop:8}}>Risk: {r.aiAnalysis.riskLevel}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
