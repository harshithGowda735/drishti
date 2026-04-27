import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';

export default function HospitalFinder() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchHospitals(); }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      // Try smart find first, fall back to regular list
      const res = await api.smartFind({ lat: 12.9716, lng: 77.5946 });
      setHospitals(res.data);
    } catch {
      try { const res = await api.getHospitals(); setHospitals(res.data); } catch {}
    }
    setLoading(false);
  };

  const filtered = hospitals.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.address?.city?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || h.type === filter;
    return matchSearch && matchFilter;
  });

  const crowdColors = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444', very_high: '#dc2626' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>📍 Smart Hospital Finder</h1>
        <p>Find the best hospital based on distance, availability & crowd density</p>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input className="input-field" placeholder="🔍 Search hospitals..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 250 }} />
        {['all', 'government', 'private', 'clinic', 'phc'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? '🏥 All' : f === 'phc' ? '🌾 PHC' : f}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner" /> : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏥</div><h3>No hospitals found</h3></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(h => (
            <div key={h._id} className="card" style={{ cursor: 'pointer' }}
              onClick={() => setSelectedHospital(h)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{h.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {h.address?.street}, {h.address?.city}</p>
                </div>
                {h.score && <div style={{ background: 'var(--gradient-primary)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{h.score}%</div>}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className={`badge badge-${h.type === 'government' ? 'primary' : 'info'}`}>{h.type}</span>
                {h.emergencyServices && <span className="badge badge-danger">🚑 Emergency</span>}
                <span className="badge" style={{ background: `${crowdColors[h.crowdDensity]}20`, color: crowdColors[h.crowdDensity] }}>
                  👥 {h.crowdDensity}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>{h.beds?.available || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Beds Free</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>⭐ {h.rating}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rating</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)' }}>{h.distance || '—'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>km away</div>
                </div>
              </div>

              <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: 14 }}
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2>{selectedHospital.name}</h2>
              <button className="btn btn-ghost" onClick={() => setSelectedHospital(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 12, background: 'var(--bg-surface)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Beds</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedHospital.beds?.total}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-surface)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Available</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>{selectedHospital.beds?.available}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-surface)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ICU Available</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--warning)' }}>{selectedHospital.beds?.icu?.available || 0}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-surface)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Emergency</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>{selectedHospital.beds?.emergency?.available || 0}</div>
              </div>
            </div>
            {selectedHospital.facilities?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: '0.88rem', marginBottom: 8 }}>Facilities</h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedHospital.facilities.map(f => <span key={f} className="badge badge-primary">{f}</span>)}
                </div>
              </div>
            )}
            <button className="btn btn-primary btn-block" onClick={() => setBookingModal(true)}>📅 Book Appointment</button>
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
        <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <h2 style={{ color: 'var(--success)' }}>Appointment Booked!</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0' }}>
            Your appointment at <strong>{hospital.name}</strong> has been confirmed.
          </p>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 16, margin: '16px 0', textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.88rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Date:</span> {form.date}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Time:</span> {form.timeSlot}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Dept:</span> {form.department}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> {form.type}</div>
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={onClose}>Done</button>
        </div>
      </div>
    );
  }

  const depts = hospital.departments?.map(d => d.name) || ['General Medicine', 'Surgery', 'Pediatrics'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2>📅 Book at {hospital.name}</h2>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Department</label>
            <select className="input-field" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
              <option value="">Select department</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Date</label>
            <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required min={new Date().toISOString().split('T')[0]} />
          </div>
          {slots.length > 0 && (
            <div className="input-group">
              <label>Available Slots</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {slots.map(s => (
                  <button type="button" key={s} onClick={() => setForm({...form, timeSlot: s})}
                    style={{ padding: '8px 14px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600,
                      background: form.timeSlot === s ? 'var(--primary)' : 'var(--bg-surface)',
                      color: form.timeSlot === s ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${form.timeSlot === s ? 'var(--primary)' : 'var(--border)'}` }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="input-group">
            <label>Symptoms (comma-separated)</label>
            <input className="input-field" placeholder="e.g. fever, headache" value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || !form.timeSlot}>
            {loading ? '⏳ Booking...' : '✅ Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
