import { useState } from 'react';

export default function Schemes() {
  const [search, setSearch] = useState('');
  const schemes = [
    { name: 'Ayushman Bharat (PM-JAY)', desc: 'Free treatment up to ₹5 lakh/year for secondary & tertiary care', eligibility: 'BPL families, SECC beneficiaries', coverage: '₹5,00,000/year', category: 'health_insurance', icon: '🏥' },
    { name: 'Janani Suraksha Yojana', desc: 'Cash incentive for institutional delivery to reduce maternal mortality', eligibility: 'Pregnant women (BPL)', coverage: '₹1,400 (Rural) / ₹1,000 (Urban)', category: 'maternal', icon: '🤱' },
    { name: 'Rashtriya Bal Swasthya Karyakram', desc: 'Free health screening & treatment for children 0-18 years', eligibility: 'All children 0-18 years', coverage: 'Free screening & treatment', category: 'child_health', icon: '👶' },
    { name: 'National Health Mission (NHM)', desc: 'Free medicines, diagnostics at public health facilities', eligibility: 'All citizens at public facilities', coverage: 'Free medicines & diagnostics', category: 'general', icon: '💊' },
    { name: 'Pradhan Mantri Suraksha Bima Yojana', desc: 'Accident insurance cover at ₹20/year premium', eligibility: 'Age 18-70 with bank account', coverage: '₹2,00,000 (death/disability)', category: 'insurance', icon: '🛡️' },
    { name: 'Pradhan Mantri Jan Arogya Yojana', desc: 'Cashless hospitalization up to ₹5 lakh at empanelled hospitals', eligibility: 'Bottom 40% of population', coverage: '₹5,00,000/family/year', category: 'health_insurance', icon: '🏨' },
  ];

  const filtered = schemes.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.includes(search.toLowerCase()));

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header"><h1>📢 Government Schemes</h1><p>Suggest eligible healthcare schemes to rural patients</p></div>
      <input className="input-field" placeholder="🔍 Search schemes..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 20, maxWidth: 400 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {filtered.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{s.icon}</div>
              <div><h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{s.name}</h3><span className="badge badge-success">{s.category.replace('_', ' ')}</span></div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{s.desc}</p>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: '0.82rem', marginBottom: 4 }}><span style={{ color: 'var(--text-muted)' }}>Eligibility:</span> {s.eligibility}</div>
              <div style={{ fontSize: '0.82rem' }}><span style={{ color: 'var(--text-muted)' }}>Coverage:</span> <strong style={{ color: 'var(--success)' }}>{s.coverage}</strong></div>
            </div>
            <button className="btn btn-outline btn-block btn-sm" style={{ marginTop: 12 }}>📋 Apply for Patient</button>
          </div>
        ))}
      </div>
    </div>
  );
}
