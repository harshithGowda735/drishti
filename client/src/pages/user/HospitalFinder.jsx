import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import * as api from '../../services/api';

const crowdColors = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444', very_high: '#dc2626' };

export default function HospitalFinder() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const cardsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchHospitals(); }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!loading && hospitals.length > 0) {
        gsap.fromTo(cardsRef.current?.children || [], 
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
        );
      }
    });
    return () => ctx.revert();
  }, [loading, filter]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await api.smartFind({ lat: 12.9716, lng: 77.5946 });
      setHospitals(res.data);
    } catch {
      try { const res = await api.getHospitals(); setHospitals(res.data); } catch {}
    }
    setLoading(false);
  };

  const filtered = hospitals.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || 
                        h.address?.city?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || h.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1>📍 Smart Hospital Finder</h1>
        <p>Real-time availability, distance & crowd analytics</p>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input 
          className="input-field" 
          placeholder="🔍 Search hospital name or city..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 300px', minWidth: 0 }} 
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'government', 'private', 'clinic', 'phc'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize', borderRadius: 20 }}>
              {f === 'all' ? '🏥 All' : f === 'phc' ? '🌾 PHC' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0' }}>
          <div className="loading-spinner" />
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Locating nearby hospitals...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏥</div>
          <h3>No hospitals found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div ref={cardsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(h => (
            <div key={h._id} className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onClick={() => setSelectedHospital(h)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {h.address?.street}, {h.address?.city}</p>
                </div>
                {h.score && (
                  <div style={{ background: 'var(--gradient-primary)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, color: '#fff', marginLeft: 8 }}>
                    {h.score}% Match
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className={`badge badge-${h.type === 'government' ? 'primary' : 'info'}`} style={{ textTransform: 'capitalize' }}>{h.type}</span>
                {h.emergencyServices && <span className="badge badge-danger">🚑 Emergency</span>}
                <span className="badge" style={{ background: `${crowdColors[h.crowdDensity] || '#666'}20`, color: crowdColors[h.crowdDensity] || '#aaa' }}>
                  👥 {h.crowdDensity?.replace('_', ' ') || 'unknown'} crowd
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1 }}>
                <div style={{ background: 'var(--bg-surface)', padding: '12px 8px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--success)' }}>{h.beds?.available || 0}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Beds Free</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px 8px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent)' }}>⭐ {h.rating}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rating</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px 8px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--secondary)' }}>{h.distance || '—'}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>km away</div>
                </div>
              </div>

              <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: 16 }}
                onClick={(e) => { e.stopPropagation(); setSelectedHospital(h); setBookingModal(true); }}>
                📅 Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModal && selectedHospital && (
        <BookingModal hospital={selectedHospital} onClose={() => { setBookingModal(false); setSelectedHospital(null); }} />
      )}

      {/* Hospital Detail Modal */}
      {selectedHospital && !bookingModal && (
        <div className="modal-overlay" onClick={() => setSelectedHospital(null)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🏥</div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 2 }}>{selectedHospital.name}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {selectedHospital.address?.street}</p>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedHospital(null)} style={{ width: 36, height: 36, borderRadius: '50%', padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total Beds', val: selectedHospital.beds?.total, col: 'var(--text-primary)' },
                { label: 'Available', val: selectedHospital.beds?.available, col: 'var(--success)' },
                { label: 'ICU Vacant', val: selectedHospital.beds?.icu?.available || 0, col: 'var(--warning)' },
                { label: 'Emergency', val: selectedHospital.beds?.emergency?.available || 0, col: 'var(--danger)' }
              ].map((item, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: item.col }}>{item.val}</div>
                </div>
              ))}
            </div>

            {selectedHospital.facilities?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>Available Facilities</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedHospital.facilities.map(f => (
                    <span key={f} className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <a href={`tel:${selectedHospital.phone || '108'}`} className="btn btn-outline" style={{ flex: 1 }}>📞 Call</a>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setBookingModal(true)}>📅 Book Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingModal({ hospital, onClose }) {
  const [form, setForm] = useState({ department: '', date: '', timeSlot: '', symptoms: '', type: 'regular' });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(modalRef.current, { y: 40, opacity: 0, duration: 0.4, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (form.date && form.department) {
      api.getAvailableSlots({ hospitalId: hospital._id, date: form.date, department: form.department })
        .then(r => setSlots(r.data.available || []))
        .catch(() => setSlots(['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00']));
    }
  }, [form.date, form.department]);

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.bookAppointment({
        hospital: hospital._id, department: form.department, date: form.date,
        timeSlot: form.timeSlot, type: form.type, symptoms: form.symptoms ? form.symptoms.split(',').map(s => s.trim()) : []
      });
      setSuccess(res.data);
    } catch (err) { alert(err.response?.data?.message || 'Booking failed'); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }} className="float-anim">✅</div>
          <h2 style={{ color: 'var(--success)', fontWeight: 900, fontSize: '1.6rem' }}>BOOKED!</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0', fontSize: '0.95rem' }}>
            Confirmed at <strong>{hospital.name}</strong>
          </p>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20, margin: '20px 0', textAlign: 'left', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Date:</span><br /><strong>{form.date}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Time:</span><br /><strong>{form.timeSlot}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Dept:</span><br /><strong>{form.department}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span><br /><strong>{form.type}</strong></div>
            </div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>Done</button>
        </div>
      </div>
    );
  }

  const depts = hospital.departments?.map(d => d.name) || ['General Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Orthopedics'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>📅 Book Appointment</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', padding: 0 }}>✕</button>
        </div>
        
        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="input-group">
            <label>Department *</label>
            <select className="input-field" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
              <option value="">Select department</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          <div className="input-group">
            <label>Date *</label>
            <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required min={new Date().toISOString().split('T')[0]} />
          </div>

          {slots.length > 0 && (
            <div className="input-group">
              <label>Select Time Slot *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {slots.map(s => (
                  <button type="button" key={s} onClick={() => setForm({...form, timeSlot: s})}
                    style={{ 
                      padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700,
                      background: form.timeSlot === s ? 'var(--gradient-primary)' : 'var(--bg-surface)',
                      color: form.timeSlot === s ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${form.timeSlot === s ? 'transparent' : 'var(--border)'}`,
                      boxShadow: form.timeSlot === s ? '0 4px 10px rgba(99,102,241,0.3)' : 'none',
                      transition: 'var(--transition)'
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Primary Symptoms</label>
            <textarea 
              className="input-field" 
              placeholder="e.g. fever since 2 days, chest pain" 
              value={form.symptoms} 
              onChange={e => setForm({...form, symptoms: e.target.value})}
              style={{ minHeight: 80, resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || !form.timeSlot} style={{ marginTop: 8 }}>
            {loading ? '⏳ Confirming...' : '✅ Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
