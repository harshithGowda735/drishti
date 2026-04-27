import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import * as api from '../../services/api';

export default function Emergency({ user }) {
  const [step, setStep] = useState('ready');
  const [result, setResult] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const cardRef = useRef(null);
  const pulseRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (step === 'ready') {
        gsap.from(cardRef.current, { scale: 0.95, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
        gsap.to(pulseRef.current, { scale: 1.05, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
    });
    return () => ctx.revert();
  }, [step]);

  const handleEmergency = async () => {
    setStep('searching');
    try {
      const res = await api.emergencyRequest({
        lat: 12.9716, lng: 77.5946,
        symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : ['Emergency'],
        notes: 'Emergency request from patient'
      });
      
      // Emit real-time notification to the found hospital
      const { emitEmergency } = await import('../../services/socket');
      if (res.data.hospital?._id) {
        emitEmergency(res.data.hospital._id, {
          patientName: user?.name || 'Anonymous Patient',
          symptoms: symptoms || 'Critical Condition',
          location: 'Current GPS'
        });
      }

      setResult(res.data);
      setStep('found');
    } catch {
      setStep('error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1>🚑 Emergency Mode</h1>
        <p>One-click emergency assistance — real-time hospital locator</p>
      </div>

      {step === 'ready' && (
        <div ref={cardRef} style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <div className="card-glass" style={{ borderColor: 'rgba(239,68,68,0.4)', padding: '40px 24px', background: 'rgba(239,68,68,0.05)' }}>
            <div style={{ fontSize: '5rem', marginBottom: 20 }} className="float-anim">🚨</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 12, color: 'var(--danger)' }}>URGENT HELP?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.95rem', lineHeight: 1.6 }}>
              Stay calm. We'll find you the closest hospital with available ICU/Emergency beds and dispatch your details.
            </p>
            
            <div className="input-group" style={{ textAlign: 'left', marginBottom: 28 }}>
              <label style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Describe symptoms (Optional)</label>
              <textarea 
                className="input-field" 
                placeholder="e.g. chest pain, major bleeding, accident" 
                value={symptoms} 
                onChange={e => setSymptoms(e.target.value)}
                style={{ minHeight: 100, resize: 'none' }}
              />
            </div>

            <button 
              ref={pulseRef}
              className="btn btn-danger btn-block btn-lg" 
              onClick={handleEmergency}
              style={{ 
                fontSize: '1.1rem', 
                padding: '20px', 
                boxShadow: '0 0 30px rgba(239,68,68,0.4)',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
              🚑 FIND NEAREST HELP NOW
            </button>
            <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Using your current GPS location
            </p>
          </div>
        </div>
      )}

      {step === 'searching' && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
            <div className="loading-spinner" style={{ borderTopColor: 'var(--danger)', width: 100, height: 100, position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🚑</div>
          </div>
          <h3 style={{ marginTop: 32, color: 'var(--danger)', fontSize: '1.4rem', fontWeight: 800 }}>FINDING THE BEST MATCH...</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '1rem' }}>Checking distance, live bed counts & ETA</p>
        </div>
      )}

      {step === 'found' && result && (
        <div className="animate-scale-in" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="card-glass" style={{ borderColor: 'var(--success)', textAlign: 'center', padding: 32, marginBottom: 20, background: 'rgba(16,185,129,0.05)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ color: 'var(--success)', fontWeight: 900, fontSize: '1.8rem', marginBottom: 6 }}>HOSPITAL SECURED</h2>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Emergency request confirmed & dispatched</p>
          </div>

          <div className="card" style={{ marginBottom: 20, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-light)' }}>{result.hospital?.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  📍 {result.hospital?.address?.street}, {result.hospital?.address?.city}
                </p>
              </div>
              <div className="badge badge-success" style={{ padding: '6px 12px' }}>Open Now</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Distance</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--secondary)' }}>{result.distance} <span style={{ fontSize: '0.8rem' }}>km</span></div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>ETA</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--warning)' }}>{result.estimatedTime}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Beds</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--success)' }}>{result.hospital?.beds?.available}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ambulance</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: 4 }}>AVAILABLE</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <a href={`tel:${result.hospital?.phone}`} className="btn btn-success btn-lg" style={{ flex: 1 }}>📞 CALL HOSPITAL</a>
              <button className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${result.hospital?.lat},${result.hospital?.lng}`)}>🗺️ NAVIGATE</button>
            </div>
          </div>

          <button className="btn btn-ghost btn-block" onClick={() => { setStep('ready'); setResult(null); }}>
            ← Back to Emergency Panel
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="animate-scale-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>⚠️</div>
          <h3 style={{ color: 'var(--danger)', fontSize: '1.5rem', fontWeight: 800 }}>NO HOSPITAL FOUND</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '1rem', lineHeight: 1.6 }}>
            We couldn't find an available match in your immediate area.<br />
            Please try again or call local emergency services (108).
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={() => setStep('ready')}>Retry Search</button>
            <a href="tel:108" className="btn btn-danger btn-lg">📞 CALL 108</a>
          </div>
        </div>
      )}
    </div>
  );
}
