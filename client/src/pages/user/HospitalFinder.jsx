import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as api from '../../services/api';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const crowdColors = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444', very_high: '#dc2626' };

export default function HospitalFinder() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [liveIntel, setLiveIntel] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const cardsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { 
    // Initial fetch with default location
    fallbackFetch(); 
  }, []);

  // Real-time IoT Sync replaced by LIVE CAMERA for the first card
  // (We'll keep the poller as a fallback but allow manual scan to override)
  useEffect(() => {
    if (hospitals.length > 0 && !isScanning) {
      const priorityId = hospitals[0]._id;
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/iot/sync/${priorityId}`);
          const data = await res.json();
          setLiveIntel(data);
          setHospitals(prev => prev.map((h, i) => i === 0 ? { ...h, crowdDensity: data.density, crowdCount: data.live_count } : h));
        } catch (err) { /* silent fallback */ }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hospitals.map(h => h._id).join(','), isScanning]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray(cardsRef.current?.children || []);
      if (!loading && targets.length > 0) {
        gsap.fromTo(targets, 
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }
        );
      }
    });
    return () => ctx.revert();
  }, [loading, filter, hospitals.length]);

  const handleLocationRequest = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLoading(true);
        try {
          const res = await api.smartFind({ lat: latitude, lng: longitude });
          setHospitals(res.data);
        } catch (err) {
          console.error("Smart Find Error:", err);
          alert("Could not fetch nearby hospitals. Showing all available.");
          await fallbackFetch();
        }
        setLoading(false);
        setLocating(false);
      }, (error) => {
        setLocating(false);
        alert("Location access denied or unavailable. Using default city view.");
        fallbackFetch();
      }, { timeout: 10000 });
    } else {
      setLocating(false);
      alert("Geolocation is not supported by your browser.");
      fallbackFetch();
    }
  };

  const fallbackFetch = async () => {
    try {
      const res = await api.smartFind({ lat: 12.9716, lng: 77.5946 });
      setHospitals(res.data);
    } catch {
      try { const res = await api.getHospitals(); setHospitals(res.data); } catch {}
    }
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
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <input 
            className="input-field" 
            placeholder="🔍 Search hospital name or city..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingRight: 110 }} 
          />
          <button 
            className={`btn btn-sm ${locating ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handleLocationRequest}
            disabled={locating}
            style={{ position: 'absolute', right: 6, top: 4, height: 36, fontSize: '0.7rem', borderRadius: 10, padding: '0 12px' }}>
            {locating ? '⌛ Locating...' : '📍 Nearby'}
          </button>
        </div>
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

              {/* LIVE CAMERA SCANNER for the first card */}
              {hospitals[0]?._id === h._id && (
                <div style={{ marginBottom: 16 }}>
                  {!isScanning ? (
                    <button 
                      className="btn btn-outline btn-sm btn-block"
                      style={{ border: '1px dashed var(--primary)', color: 'var(--primary-light)', fontSize: '0.75rem' }}
                      onClick={(e) => { e.stopPropagation(); setIsScanning(true); }}>
                      📷 ACTIVATE LIVE CCTV SCANNER
                    </button>
                  ) : (
                    <LiveCameraScanner 
                      onUpdate={(count) => {
                        const density = count > 10 ? 'high' : count > 5 ? 'moderate' : 'low';
                        setHospitals(prev => prev.map((item, i) => i === 0 ? { ...item, crowdDensity: density, crowdCount: count } : item));
                        setLiveIntel({ live_count: count, density, camera_metadata: { model: 'Laptop-Front-CAM' } });
                      }}
                      onClose={() => setIsScanning(false)}
                    />
                  )}
                </div>
              )}

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
        <BookingModal 
          hospital={selectedHospital} 
          allHospitals={hospitals}
          onClose={() => { setBookingModal(false); setSelectedHospital(null); }} 
          onSwitchHospital={(h) => setSelectedHospital(h)}
        />
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

function BookingModal({ hospital, allHospitals, onClose, onSwitchHospital }) {
  const [form, setForm] = useState({ department: '', date: '', timeSlot: '', symptoms: '', type: 'regular' });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const assignedDoctor = "Dr. Sarah Wilson"; // Mocked for demo

  useEffect(() => {
    if (form.date && form.department) {
      api.getAvailableSlots({ hospitalId: hospital._id, date: form.date, department: form.department })
        .then(r => setSlots(r.data.available || []))
        .catch(() => setSlots(['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00']));
    }
  }, [form.date, form.department]);

  const handleBook = async (e) => {
    e.preventDefault();
    setPaymentStep(true);
  };

  const generateReceiptPDF = () => {
    if (!success) return;
    const doc = new jsPDF();
    const patientId = `HC-P-${Math.floor(Math.random()*10000)}`;

    // Add Branding
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('HEALTHCONNECT RECEIPT', 20, 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Hospital Information:', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${hospital.name}`, 20, 62);
    doc.text(`${hospital.address?.street}, ${hospital.address?.city}`, 20, 69);
    doc.text(`Contact: ${hospital.phone}`, 20, 76);

    doc.setFont('helvetica', 'bold');
    doc.text('Appointment Details:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient ID: ${patientId}`, 120, 62);
    doc.text(`Doctor: ${assignedDoctor}`, 120, 69);
    doc.text(`Location: ${hospital.address?.city}`, 120, 76);
    doc.text(`Date: ${form.date}`, 120, 83);
    doc.text(`Time: ${form.timeSlot}`, 120, 90);

    // Table
    doc.autoTable({
      startY: 105,
      head: [['Description', 'Status', 'Paid Amount']],
      body: [
        ['General Consultation', 'CONFIRMED', '₹100.00'],
        ['Hospital Facility Fee', 'PAID', 'Included'],
        ['Total Paid', 'SECURE', '₹100.00'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`This receipt confirms your booking at ${hospital.name}.`, 20, doc.lastAutoTable.finalY + 20);
    doc.text(`Amount Paid: ₹100.00 | Location: ${hospital.address?.street}, ${hospital.address?.city}`, 20, doc.lastAutoTable.finalY + 27);
    doc.text('This is an electronically generated receipt.', 20, doc.lastAutoTable.finalY + 34);

    doc.save(`HC_Receipt_${hospital.name.replace(/\s/g, '_')}.pdf`);
  };

  const confirmPayment = async () => {
    if (!form.department || !form.date || !form.timeSlot) {
      alert("Please fill all required fields");
      setPaymentStep(false);
      return;
    }

    setLoading(true);
    try {
      // Normalize date to YYYY-MM-DD to avoid timezone shifts
      const normalizedDate = new Date(form.date).toISOString().split('T')[0];
      
      const res = await api.bookAppointment({
        hospital: hospital._id, 
        department: form.department, 
        date: normalizedDate,
        timeSlot: form.timeSlot, 
        type: form.type || 'regular', 
        symptoms: form.symptoms ? form.symptoms.split(',').map(s => s.trim()) : [],
        isPaid: true, 
        fee: 100,
        doctor: assignedDoctor // Include the assigned doctor
      });
      setSuccess(res.data);
    } catch (err) { 
      console.error("Booking Error:", err);
      alert(err.response?.data?.message || 'Booking failed. Please try again.'); 
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 440, border: '2px solid var(--success)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }} className="float-anim">📩</div>
          <h2 style={{ color: 'var(--success)', fontWeight: 900, fontSize: '1.6rem' }}>SMS RECEIPT SENT!</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0', fontSize: '0.95rem' }}>
            Confirmed at <strong>{hospital.name}</strong>
          </p>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20, margin: '20px 0', textAlign: 'left', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, right: 10, background: 'var(--success)', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>PAID ₹100</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Patient ID:</span><br /><strong>HC-P-{Math.floor(Math.random()*10000)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Doctor:</span><br /><strong>{assignedDoctor}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Date:</span><br /><strong>{form.date}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Time:</span><br /><strong>{form.timeSlot}</strong></div>
            </div>
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px dashed var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Scan QR at hospital for instant entry
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline btn-block" style={{ flex: 1 }} onClick={generateReceiptPDF}>
              📄 Download PDF
            </button>
            <button className="btn btn-primary btn-block" style={{ flex: 1.5 }} onClick={onClose}>
              Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep) {
    return (
      <div className="modal-overlay" onClick={() => setPaymentStep(false)}>
        <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💳</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8 }}>Secure Payment</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
            Appointment booking fee for <strong>{hospital.name}</strong>
          </p>
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, marginBottom: 24, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹100</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Standard Consultation Fee</div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={confirmPayment} disabled={loading}>
            {loading ? 'Processing...' : 'Pay & Confirm Booking'}
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setPaymentStep(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  const depts = hospital.departments?.map(d => d.name) || ['General Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Orthopedics'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>📅 Book Appointment</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', padding: 0 }}>✕</button>
        </div>

        {/* Real-time Crowd Status */}
        <div style={{ 
          background: hospital.crowdDensity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 24,
          borderLeft: `4px solid ${hospital.crowdDensity === 'high' ? 'var(--danger)' : 'var(--success)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: hospital.crowdDensity === 'high' ? 'var(--danger)' : 'var(--success)', textTransform: 'uppercase', marginBottom: 2 }}>
              Live Crowd Status: {hospital.crowdDensity?.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Est. Wait: {hospital.crowdDensity === 'high' ? '45-60 mins' : '5-10 mins'}
            </div>
          </div>
          {hospital.crowdDensity === 'high' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CROWDED! TRY:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {allHospitals
                  .filter(h => h._id !== hospital._id && (h.crowdDensity === 'low' || h.crowdDensity === 'moderate'))
                  .slice(0, 2)
                  .map(h => (
                    <button key={h._id} onClick={() => onSwitchHospital(h)}
                      style={{ 
                        fontSize: '0.65rem', padding: '4px 8px', borderRadius: 6, 
                        background: 'var(--primary-light)', color: 'white', border: 'none', 
                        cursor: 'pointer', fontWeight: 700 
                      }}>
                      {h.name.split(' ')[0]}...
                    </button>
                  ))
                }
              </div>
            </div>
          )}
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

function LiveCameraScanner({ onUpdate, onClose }) {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    cocoSsd.load().then(m => setModel(m));
    setupCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setScanning(true);
        };
      }
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Please allow camera access for live scanning.");
      onClose();
    }
  };

  useEffect(() => {
    let frameId;
    const detect = async () => {
      if (model && videoRef.current && videoRef.current.readyState === 4) {
        const predictions = await model.detect(videoRef.current);
        const people = predictions.filter(p => p.class === 'person').length;
        onUpdate(people);
      }
      frameId = requestAnimationFrame(detect);
    };
    if (scanning) detect();
    return () => cancelAnimationFrame(frameId);
  }, [model, scanning]);

  return (
    <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid var(--primary)', marginTop: 12 }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: 160, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1s infinite' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>AI SCANNING ACTIVE</span>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ✕
      </button>
    </div>
  );
}
