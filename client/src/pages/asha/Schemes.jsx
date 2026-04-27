import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const schemes = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat (PM-JAY)',
    desc: 'Free treatment up to ₹5 lakh/year for secondary & tertiary care at empanelled hospitals.',
    eligibility: 'BPL families, SECC beneficiaries',
    coverage: '₹5,00,000 / year',
    category: 'health_insurance',
    icon: '🏥',
    documents: ['Aadhaar Card', 'Ration Card', 'Income Certificate'],
    color: '#6366f1',
  },
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana (JSY)',
    desc: 'Cash incentive for institutional delivery to reduce maternal and infant mortality.',
    eligibility: 'Pregnant women (BPL)',
    coverage: '₹1,400 rural / ₹1,000 urban',
    category: 'maternal',
    icon: '🤱',
    documents: ['Aadhaar Card', 'Pregnancy Card', 'BPL Certificate'],
    color: '#ec4899',
  },
  {
    id: 'rbsk',
    name: 'Rashtriya Bal Swasthya Karyakram',
    desc: 'Free health screening & treatment for children aged 0–18 years.',
    eligibility: 'All children 0–18 years',
    coverage: 'Free screening & treatment',
    category: 'child_health',
    icon: '👶',
    documents: ['Birth Certificate', 'Aadhaar Card'],
    color: '#06b6d4',
  },
  {
    id: 'nhm',
    name: 'National Health Mission (NHM)',
    desc: 'Free medicines and diagnostics at all public health facilities.',
    eligibility: 'All citizens at public facilities',
    coverage: 'Free medicines & diagnostics',
    category: 'general',
    icon: '💊',
    documents: ['Any Government ID'],
    color: '#10b981',
  },
  {
    id: 'pmsby',
    name: 'PM Suraksha Bima Yojana',
    desc: 'Accident insurance at just ₹20/year premium for bank account holders.',
    eligibility: 'Age 18–70 with savings account',
    coverage: '₹2,00,000 (death/disability)',
    category: 'insurance',
    icon: '🛡️',
    documents: ['Aadhaar Card', 'Bank Passbook'],
    color: '#f59e0b',
  },
  {
    id: 'asha',
    name: 'ASHA Incentive Scheme',
    desc: 'Performance-based incentives for ASHA workers for community health activities.',
    eligibility: 'Registered ASHA Workers',
    coverage: 'Variable incentives per task',
    category: 'asha',
    icon: '🌾',
    documents: ['ASHA ID Card', 'Activity Register'],
    color: '#8b5cf6',
  },
];

const categoryLabels = {
  health_insurance: 'Insurance',
  maternal:         'Maternal',
  child_health:     'Child Health',
  general:          'General',
  insurance:        'Insurance',
  asha:             'ASHA',
};

// ── Toast Component ──────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span>{type === 'success' ? '✅' : 'ℹ️'}</span>
      <span>{msg}</span>
    </div>
  );
}

// ── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ scheme, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=patient info, 2=confirm
  const [form, setForm] = useState({
    patientName: '', phone: '', village: '', aadhaar: '', dob: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(modalRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setSubmitting(true);
    // Simulate API submission (backend can persist in a SchemeApplications collection)
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    onSuccess(`Application for "${scheme.name}" submitted successfully!`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={modalRef} style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${scheme.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{scheme.icon}</div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 2 }}>Apply — {scheme.name}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-surface)', border: 'none', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: '50%', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? scheme.color : 'var(--border)', transition: 'var(--transition)' }} />
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 1 ? (
            <>
              <div className="input-group">
                <label>Patient Full Name *</label>
                <input className="input-field" placeholder="As per Aadhaar" value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Phone Number *</label>
                  <input className="input-field" placeholder="10-digit" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required inputMode="tel" />
                </div>
                <div className="input-group">
                  <label>Date of Birth</label>
                  <input type="date" className="input-field" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label>Village / Address</label>
                <input className="input-field" placeholder="Village or locality name" value={form.village} onChange={e => setForm({...form, village: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Aadhaar Number *</label>
                <input className="input-field" placeholder="XXXX-XXXX-XXXX" value={form.aadhaar} onChange={e => setForm({...form, aadhaar: e.target.value})} required inputMode="numeric" maxLength="14" />
              </div>
            </>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>Application Summary</h4>
                {[
                  ['Scheme', scheme.name],
                  ['Patient', form.patientName],
                  ['Phone', form.phone],
                  ['Village', form.village || '—'],
                  ['Aadhaar', form.aadhaar],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: 12, fontSize: '0.82rem', color: 'var(--success)' }}>
                📋 Required documents: {scheme.documents.join(', ')}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {step === 2 && (
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
              {submitting ? '⏳ Submitting...' : step === 1 ? 'Next →' : '✅ Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Schemes Page ─────────────────────────────────────────────────────────
export default function Schemes() {
  const [search, setSearch]             = useState('');
  const [selectedCategory, setCategory] = useState('all');
  const [applyScheme, setApplyScheme]   = useState(null);
  const [toast, setToast]               = useState(null);
  const cardsRef = useRef(null);

  // GSAP card entrance stagger
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardsRef.current) {
        gsap.fromTo(cardsRef.current.children, 
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power3.out' }
        );
      }
    });
    return () => ctx.revert();
  }, [selectedCategory]);

  const categories = ['all', ...new Set(schemes.map(s => s.category))];

  const filtered = schemes.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat    = selectedCategory === 'all' || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1>📢 Government Schemes</h1>
        <p>Apply for eligible healthcare schemes on behalf of your patients</p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input-field" placeholder="🔍 Search schemes..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', minWidth: 0 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ padding: '8px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, minHeight: 44,
                background: selectedCategory === cat ? 'var(--gradient-primary)' : 'var(--bg-surface)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${selectedCategory === cat ? 'transparent' : 'var(--border)'}`,
                transition: 'var(--transition)', cursor: 'pointer' }}>
              {cat === 'all' ? 'All' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scheme Cards */}
      <div ref={cardsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
        {filtered.map((s) => (
          <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: 4 }}>{s.name}</h3>
                <span className="badge" style={{ background: `${s.color}18`, color: s.color }}>{categoryLabels[s.category]}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 12, flex: 1, lineHeight: 1.6 }}>{s.desc}</p>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Eligibility: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{s.eligibility}</span>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coverage: </span>
                <strong style={{ color: s.color }}>{s.coverage}</strong>
              </div>
            </div>

            <button className="btn btn-primary btn-block btn-sm"
              style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`, boxShadow: `0 4px 14px ${s.color}30` }}
              onClick={() => setApplyScheme(s)}>
              📋 Apply for Patient
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No schemes found</h3>
          <p>Try a different search term</p>
        </div>
      )}

      {/* Apply Modal */}
      {applyScheme && (
        <ApplyModal
          scheme={applyScheme}
          onClose={() => setApplyScheme(null)}
          onSuccess={(msg) => setToast(msg)}
        />
      )}

      {/* Toast notification */}
      {toast && <Toast msg={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
