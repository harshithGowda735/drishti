import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const mockPatients = [
  { id: 1, name: 'Kamala Devi',   age: 45, gender: 'F', village: 'Hosahalli', phone: '9876543101', condition: 'Diabetes',     bloodGroup: 'B+', lastVisit: '2026-04-25', status: 'active' },
  { id: 2, name: 'Lakshmi Bai',   age: 32, gender: 'F', village: 'Kempura',   phone: '9876543102', condition: 'Pregnancy',    bloodGroup: 'O+', lastVisit: '2026-04-20', status: 'active' },
  { id: 3, name: 'Raju Gowda',    age: 60, gender: 'M', village: 'Hosahalli', phone: '9876543103', condition: 'Hypertension', bloodGroup: 'A+', lastVisit: '2026-04-24', status: 'active' },
  { id: 4, name: 'Savitha R.',    age: 28, gender: 'F', village: 'Belur',     phone: '9876543104', condition: 'Anemia',       bloodGroup: 'AB+',lastVisit: '2026-04-26', status: 'active' },
  { id: 5, name: 'Basavaraj K.',  age: 55, gender: 'M', village: 'Mandya',    phone: '9876543105', condition: 'Arthritis',    bloodGroup: 'O-', lastVisit: '2026-04-18', status: 'inactive' },
  { id: 6, name: 'Meena Kumari',  age: 38, gender: 'F', village: 'Kempura',   phone: '9876543106', condition: 'Anemia',       bloodGroup: 'B-', lastVisit: '2026-04-27', status: 'active' },
];

export default function AshaPatients() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardsRef.current) {
        gsap.fromTo(cardsRef.current.children, 
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power3.out' }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const filtered = mockPatients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.village.toLowerCase().includes(search.toLowerCase()) ||
    p.condition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1>👥 Assigned Patients</h1>
        <p>View and manage your assigned patient list</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center' }}>
        <input className="input-field" placeholder="🔍 Search by name, village or condition..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} patients
        </div>
      </div>

      <div ref={cardsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(p => (
          <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.id === p.id ? null : p)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                  {p.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{p.age}y · {p.gender} · {p.bloodGroup}</div>
                </div>
              </div>
              <span className={`badge badge-${p.status === 'active' ? 'success' : 'warning'}`}>{p.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>📍 </span>{p.village}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>🩺 </span>{p.condition}</div>
            </div>

            {/* Expanded detail */}
            {selected?.id === p.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>📞 </span><a href={`tel:${p.phone}`} style={{ color: 'var(--primary-light)' }}>{p.phone}</a></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>📅 </span>{p.lastVisit}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <a href={`tel:${p.phone}`} className="btn btn-success btn-sm" style={{ flex: 1, textAlign: 'center' }}>📞 Call</a>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); }}>📅 Book Appt</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
