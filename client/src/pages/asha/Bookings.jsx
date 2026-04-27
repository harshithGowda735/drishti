import { useState, useEffect } from 'react';
import * as api from '../../services/api';

export default function AshaBookings({ user }) {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({ patientName: '', patientPhone: '', hospital: '', department: '', date: '', timeSlot: '', symptoms: '' });
  const [slots, setSlots] = useState([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.getHospitals().then(r => setHospitals(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.hospital && form.date && form.department) {
      api.getAvailableSlots({ hospitalId: form.hospital, date: form.date, department: form.department })
        .then(r => setSlots(r.data.available || []))
        .catch(() => setSlots(['09:00','10:00','11:00','14:00','15:00','16:00']));
    }
  }, [form.hospital, form.date, form.department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.bookAppointment({
        hospital: form.hospital, department: form.department, date: form.date,
        timeSlot: form.timeSlot, type: 'regular', bookedBy: 'asha_worker',
        symptoms: form.symptoms ? form.symptoms.split(',') : []
      });
      setSuccess(true);
    } catch { alert('Booking failed'); }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: 60, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
      <h2 style={{ color: 'var(--success)', marginBottom: 8 }}>Booking Successful!</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Appointment booked for {form.patientName}</p>
      <button className="btn btn-primary" onClick={() => { setSuccess(false); setForm({ patientName: '', patientPhone: '', hospital: '', department: '', date: '', timeSlot: '', symptoms: '' }); }} style={{ marginTop: 20 }}>Book Another</button>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header"><h1>📅 Book for Patient</h1><p>Assist rural patients with hospital appointment bookings</p></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group"><label>Patient Name</label><input className="input-field" value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} required /></div>
            <div className="input-group"><label>Phone</label><input className="input-field" value={form.patientPhone} onChange={e => setForm({...form, patientPhone: e.target.value})} required /></div>
          </div>
          <div className="input-group"><label>Hospital</label>
            <select className="input-field" value={form.hospital} onChange={e => setForm({...form, hospital: e.target.value})} required>
              <option value="">Select hospital</option>
              {hospitals.map(h => <option key={h._id} value={h._id}>{h.name} — {h.beds?.available} beds free</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group"><label>Department</label>
              <select className="input-field" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                <option value="">Select</option>
                {['General Medicine', 'Pediatrics', 'Surgery', 'Maternity'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="input-group"><label>Date</label><input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required min={new Date().toISOString().split('T')[0]} /></div>
          </div>
          {slots.length > 0 && (
            <div className="input-group"><label>Time Slot</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {slots.map(s => <button type="button" key={s} onClick={() => setForm({...form, timeSlot: s})} style={{ padding: '8px 14px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600, background: form.timeSlot === s ? 'var(--primary)' : 'var(--bg-surface)', color: form.timeSlot === s ? 'white' : 'var(--text-secondary)', border: `1px solid ${form.timeSlot === s ? 'var(--primary)' : 'var(--border)'}` }}>{s}</button>)}
              </div>
            </div>
          )}
          <div className="input-group"><label>Symptoms</label><input className="input-field" placeholder="e.g. fever, cough" value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} /></div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={!form.timeSlot}>🤝 Book Appointment</button>
        </form>
      </div>
    </div>
  );
}
