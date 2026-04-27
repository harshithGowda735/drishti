import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import * as api from '../../services/api';

export default function AIAnalysis() {
  const [reportType, setReportType] = useState('blood_test');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [reportDetails, setReportDetails] = useState('');
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
    if (!file && !reportDetails) { alert('Please provide a report file or details'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.analyzeReport({ 
        reportType, 
        reportDetails: reportDetails || `Analysis for ${file?.name}` 
      });
      setResult(res.data);
      // Animation for results appearance
      setTimeout(() => {
        gsap.fromTo(rightColRef.current?.children || [], 
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
        );
      }, 100);
    } catch (err) { 
      console.error(err);
      alert('AI Analysis failed. Please check your connection or API key.'); 
    }
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

          <div className="input-group" style={{ marginBottom: 20 }}>
            <label>📝 Report Summary / Symptoms</label>
            <textarea 
              className="input-field" 
              placeholder="e.g., Blood sugar 240 mg/dL, High cholesterol..."
              style={{ minHeight: 100, resize: 'vertical' }}
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-block btn-lg" onClick={handleAnalyze} disabled={loading}>
            {loading ? '🔄 Consulting Gemma 3 AI...' : '🧠 Start AI Analysis'}
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
              {/* Header Section */}
              <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>🤖</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Gemma 3 AI Insights</h3>
                  </div>
                  <span className={`badge badge-${result.riskLevel === 'high' || result.riskLevel === 'critical' ? 'danger' : result.riskLevel === 'moderate' ? 'warning' : 'success'}`} style={{ textTransform: 'uppercase' }}>
                    {result.riskLevel} Risk
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="card">
                <h4 style={{ color: 'var(--primary-light)', marginBottom: 10 }}>📋 Analysis Summary</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{result.insights}</p>
              </div>

              {/* Routines */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ borderTop: '3px solid #10b981' }}>
                  <h4 style={{ color: '#10b981', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🥗 Food Routine
                  </h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{result.foodRoutine}</p>
                </div>

                <div className="card" style={{ borderTop: '3px solid #0ea5e9' }}>
                  <h4 style={{ color: '#0ea5e9', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🚶 Walking Routine
                  </h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{result.walkRoutine}</p>
                </div>
              </div>

              {/* Precautions */}
              <div className="card" style={{ borderLeft: '4px solid var(--danger)', background: 'rgba(239,68,68,0.05)' }}>
                <h4 style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠️ Precautions</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.precautions}</p>
              </div>
              
              <button className="btn btn-outline btn-block" onClick={() => setResult(null)}>Analyze Another Report</button>
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
