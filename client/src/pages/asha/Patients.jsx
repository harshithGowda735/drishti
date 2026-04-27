import { useState } from 'react';

export default function AshaPatients() {
  const [search, setSearch] = useState('');
  const [patients] = useState([
    { id: 1, name: 'Kamala Devi', age: 45, gender: 'F', village: 'Hosahalli', phone: '9876543101', condition: 'Diabetes', bloodGroup: 'B+', lastVisit: '2026-04-25', status: 'active' },
    { id: 2, name: 'Lakshmi Bai', age: 32, gender: 'F', village: 'Kempura', phone: '9876543102', condition: 'Pregnancy', bloodGroup: 'O+', lastVisit: '2026-04-20', status: 'active' },
    { id: 3, name: 'Raju Gowda', age: 60, gender: 'M', village: 'Hosahalli', phone: '9876543103', condition: 'Hypertension', bloodGroup: 'A+', lastVisit: '2026-04-24', status: 'active' },
    { id: 4, name: 'Savitha R.', age: 28, gender: 'F', village: 'Belur', phone: '9876543104', condition: 'Anemia', bloodGroup: 'AB+', lastVisit: '2026-04-26', status: 'active' },
    { id: 5, name: 'Basavaraj K.', age: 55, gender: 'M', village: 'Mandya', phone: '9876543105', condition: 'Arthritis', bloodGroup: 'O-', lastVisit: '2026-04-18', status: 'inactive' },
  ]);

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header"><h1>👥 Assigned Patients</h1><p>Access limited patient data for healthcare support</p></div>
      <input className="input-field" placeholder="🔍 Search patients by name or village..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 20, maxWidth: 400 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map(p => (
          <div key={p.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{p.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.age}y • {p.gender} • {p.bloodGroup}</div>
                </div>
              </div>
              <span className={`badge badge-${p.status === 'active' ? 'success' : 'warning'}`}>{p.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.82rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>📍 Village:</span> {p.village}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>📞 Phone:</span> {p.phone}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>🩺 Condition:</span> {p.condition}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>📅 Last Visit:</span> {p.lastVisit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
