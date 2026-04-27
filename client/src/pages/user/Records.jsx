import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import * as api from '../../services/api';

const typeIcons = { 
  lab_report: '🧪', prescription: '💊', imaging: '🩻', 
  discharge_summary: '📄', vaccination: '💉', surgery: '🔬', other: '📋' 
};

export default function MedicalRecords({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      api.getPatientRecords(user._id)
        .then(r => setRecords(r.data))
        .catch(() => setRecords([]))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, [user]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!loading && records.length > 0) {
        gsap.from(listRef.current?.children || [], {
          x: -20, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out'
        });
      }
    });
    return () => ctx.revert();
  }, [loading, records.length]);

  return (
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1>📋 Medical Records</h1>
        <p>Your secure, centralized health history & digital diagnostic vault</p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0' }}>
          <div className="loading-spinner" />
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Retrieving your medical history...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>Your vault is empty</h3>
          <p style={{ color: 'var(--text-muted)' }}>Records will appear here automatically after your hospital visits.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>🔄 Refresh Records</button>
        </div>
      ) : (
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 800, margin: '0 auto' }}>
          {records.map(r => (
            <div key={r._id} className="card-glass" style={{ borderLeft: `4px solid var(--primary-light)` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0, border: '1px solid var(--border)' }}>
                  {typeIcons[r.type] || '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{r.title}</h3>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>{r.type?.replace('_', ' ')}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • {r.hospital?.name || 'External Lab'}
                  </p>
                </div>
              </div>

              {r.description && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>{r.description}</p>
              )}

              {r.aiAnalysis && (
                <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 12, padding: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🧠</span> AI SMART SUMMARY
                    </div>
                    {r.aiAnalysis.riskLevel && (
                      <span className={`badge badge-${r.aiAnalysis.riskLevel === 'low' ? 'success' : r.aiAnalysis.riskLevel === 'high' ? 'danger' : 'warning'}`} style={{ fontSize: '0.6rem', fontWeight: 800 }}>
                        {r.aiAnalysis.riskLevel.toUpperCase()} RISK
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.aiAnalysis.summary}</p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}>📄 View Full PDF</button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>📤 Share with Doctor</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
