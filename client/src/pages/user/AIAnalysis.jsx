import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import * as api from '../../services/api';

export default function AIAnalysis() {
  const [reportType, setReportType] = useState('blood_test');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftColRef.current, { x: -30, opacity: 0, duration: 0.6, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  const reportTypes = [
    { value: 'blood_test', icon: '🧪', label: 'Blood Test' },
    { value: 'xray', icon: '🩻', label: 'X-Ray' },
    { value: 'mri', icon: '🧲', label: 'MRI Scan' },
    { value: 'ecg', icon: '❤️', label: 'ECG' }
  ];

  const handleAnalyze = async () => {
    if (!file) { alert('Please select a report file first'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.analyzeReport({ reportType, fileName: file.name });
      setResult(res.data);
      // Animation for results appearance
      setTimeout(() => {
        gsap.fromTo(rightColRef.current?.children || [], 
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
        );
      }, 100);
    } catch { alert('Analysis failed'); }
    setLoading(false);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const riskColors = { low: 'var(--success)', moderate: 'var(--warning)', high: 'var(--danger)', critical: '#dc2626' };

  return (
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1>🧠 AI Report Analysis</h1>
        <p>Instant insights using advanced Computer Vision & Medical Intelligence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Upload Section */}
        <div ref={leftColRef} className="card-glass" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--primary-light)' }}>📤 Select Report Type</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
            {reportTypes.map(r => (
              <button key={r.value} onClick={() => setReportType(r.value)}
                style={{
                  padding: '18px 12px', borderRadius: 14, textAlign: 'center', fontSize: '0.9rem',
                  background: reportType === r.value ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
                  border: `1.5px solid ${reportType === r.value ? 'var(--primary)' : 'var(--border)'}`,
                  color: reportType === r.value ? 'var(--primary-light)' : 'var(--text-secondary)',
                  transition: 'var(--transition)',
                  transform: reportType === r.value ? 'scale(1.02)' : 'scale(1)',
                }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontWeight: 700 }}>{r.label}</div>
              </button>
            ))}
          </div>

          <div 
            onClick={() => fileInputRef.current.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary-light)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', 
              padding: '40px 20px',
              textAlign: 'center', 
              marginBottom: 24, 
              cursor: 'pointer',
              background: isDragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'var(--transition)',
              position: 'relative'
            }} 
            className="card-hover">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              hidden 
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {file ? (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-light)' }}>{file.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📂</div>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>Drop report file here</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supported: PDF, JPG, PNG (Max 10MB)</p>
              </>
            )}
          </div>

          <button className="btn btn-primary btn-block btn-lg" onClick={handleAnalyze} disabled={loading}>
            {loading ? '🔄 Running AI Models...' : '🧠 Start AI Analysis'}
          </button>
        </div>

        {/* Results Section */}
        <div ref={rightColRef}>
          {loading ? (
            <div className="card-glass" style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="loading-spinner" style={{ width: 60, height: 60, borderTopColor: 'var(--primary-light)' }} />
              <h3 style={{ color: 'var(--text-primary)', marginTop: 24, fontWeight: 800 }}>Analyzing Report...</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.85rem' }}>Processing through Medical CV models</p>
              
              <div style={{ width: '100%', maxWidth: 240, height: 6, background: 'var(--bg-surface)', borderRadius: 10, marginTop: 24, overflow: 'hidden' }}>
                <div className="progress-bar-fill" style={{ width: '70%', background: 'var(--gradient-primary)', animation: 'shimmer 2s infinite linear' }} />
              </div>
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Model info */}
              <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>🤖</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Analysis Engine</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-primary">{result.model}</span>
                    <span className="badge badge-success">{(result.confidence * 100).toFixed(0)}% Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="card" style={{ borderLeft: `4px solid ${riskColors[result.analysis.riskLevel]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>📝 Executive Summary</h4>
                  <span className="badge" style={{
                    background: `${riskColors[result.analysis.riskLevel]}15`,
                    color: riskColors[result.analysis.riskLevel],
                    fontWeight: 800
                  }}>RISK: {result.analysis.riskLevel?.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.analysis.summary}</p>
              </div>

              {/* Findings */}
              <div className="card">
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 16 }}>🔍 Key Findings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.analysis.findings?.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', marginTop: 2 }}>✓</div>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="card" style={{ borderTop: '1px solid rgba(16,185,129,0.2)', background: 'linear-gradient(135deg, var(--bg-card), rgba(16,185,129,0.05))' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 16, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>💡</span> Clinical Recommendations
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.analysis.recommendations?.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#fff', marginTop: 2 }}>→</div>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button className="btn btn-outline btn-block" onClick={() => setResult(null)}>Reset Analysis</button>
            </div>
          ) : (
            <div className="card-glass" style={{ textAlign: 'center', padding: '100px 20px', opacity: 0.8 }}>
              <div style={{ fontSize: '4rem', marginBottom: 20 }} className="float-anim">🧠</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Awaiting Analysis</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 12, maxWidth: 300, margin: '12px auto' }}>
                Select a report type and upload your file to get instant AI-powered health insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
