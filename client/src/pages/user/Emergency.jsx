import { useState } from 'react';
import * as api from '../../services/api';

export default function Emergency({ user }) {
  const [step, setStep] = useState('ready');
  const [result, setResult] = useState(null);
  const [symptoms, setSymptoms] = useState('');

  const handleEmergency = async () => {
    setStep('searching');
    try {
      const res = await api.emergencyRequest({
        lat: 12.9716, lng: 77.5946,
        symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : ['Emergency'],
        notes: 'Emergency request from patient'
      });
      setResult(res.data);
      setStep('found');
    } catch {
      setStep('error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>🚑 Emergency Mode</h1>
        <p>One-click emergency assistance — nearest hospital with available beds</p>
      </div>

      {step === 'ready' && (
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', padding: 40 }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🚨</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Need Emergency Help?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
              Press the button below to instantly find the nearest hospital with emergency services and available beds.
            </p>
            <div className="input-group" style={{ textAlign: 'left', marginBottom: 20 }}>
              <label>Describe symptoms (optional)</label>
              <input className="input-field" placeholder="e.g. chest pain, breathing difficulty" value={symptoms} onChange={e => setSymptoms(e.target.value)} />
            </div>
            <button className="btn btn-danger btn-block btn-lg" onClick={handleEmergency}
              style={{ fontSize: '1.1rem', padding: '18px', animation: 'pulse 2s infinite' }}>
              🚑 EMERGENCY — FIND HOSPITAL NOW
            </button>
          </div>
        </div>
      )}

      {step === 'searching' && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" style={{ borderTopColor: 'var(--danger)', width: 60, height: 60 }} />
          <h3 style={{ marginTop: 24, color: 'var(--danger)' }}>🔍 Searching nearest hospitals...</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Analyzing distance, bed availability & emergency capacity</p>
        </div>
      )}

      {step === 'found' && result && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)', textAlign: 'center', padding: 32, marginBottom: 20 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h2 style={{ color: 'var(--success)', marginBottom: 4 }}>Hospital Found!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Emergency appointment confirmed</p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>🏥 {result.hospital?.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distance</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)' }}>{result.distance} km</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ETA</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)' }}>{result.estimatedTime}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Beds</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{result.hospital?.beds?.available}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-light)' }}>{result.hospital?.phone}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 12 }}>
              📍 {result.hospital?.address?.street}, {result.hospital?.address?.city}
            </p>
          </div>

          <button className="btn btn-primary btn-block" onClick={() => { setStep('ready'); setResult(null); }}>🔄 Start Over</button>
        </div>
      )}

      {step === 'error' && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
          <h3 style={{ color: 'var(--danger)' }}>Could not find a hospital</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Please try again or call emergency services directly</p>
          <button className="btn btn-primary" onClick={() => setStep('ready')} style={{ marginTop: 20 }}>Try Again</button>
        </div>
      )}
    </div>
  );
}
