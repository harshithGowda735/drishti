import { useState } from 'react';
import * as api from '../../services/api';

export default function AIAnalysis() {
  const [reportType, setReportType] = useState('blood_test');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'blood_test', icon: '🧪', label: 'Blood Test' },
    { value: 'xray', icon: '🩻', label: 'X-Ray' },
    { value: 'mri', icon: '🧲', label: 'MRI Scan' },
    { value: 'ecg', icon: '❤️', label: 'ECG' }
  ];

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.analyzeReport({ reportType });
      setResult(res.data);
    } catch { alert('Analysis failed'); }
    setLoading(false);
  };

  const riskColors = { low: 'var(--success)', moderate: 'var(--warning)', high: 'var(--danger)', critical: '#dc2626' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1>🧠 AI Report Analysis</h1>
        <p>Upload reports and get instant AI-powered analysis using YOLO + Computer Vision</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upload Section */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>📤 Select Report Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {reportTypes.map(r => (
              <button key={r.value} onClick={() => setReportType(r.value)}
                style={{
                  padding: '16px 14px', borderRadius: 10, textAlign: 'center', fontSize: '0.88rem',
                  background: reportType === r.value ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
                  border: `1.5px solid ${reportType === r.value ? 'var(--primary)' : 'var(--border)'}`,
                  color: reportType === r.value ? 'var(--primary-light)' : 'var(--text-secondary)',
                  transition: 'var(--transition)'
                }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontWeight: 600 }}>{r.label}</div>
              </button>
            ))}
          </div>

          {/* Upload area */}
          <div style={{
            border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '32px',
            textAlign: 'center', marginBottom: 20, cursor: 'pointer',
            background: 'rgba(99,102,241,0.03)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📂</div>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>Drop report file here</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG — Max 10MB</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--primary-light)', marginTop: 8 }}>
              For demo: Click analyze to see sample AI results
            </p>
          </div>

          <button className="btn btn-primary btn-block btn-lg" onClick={handleAnalyze} disabled={loading}>
            {loading ? '🔄 Analyzing with YOLO...' : '🧠 Run AI Analysis'}
          </button>
        </div>

        {/* Results Section */}
        <div>
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div className="loading-spinner" />
              <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Running YOLO analysis model...</p>
              <div className="progress-bar" style={{ marginTop: 16, maxWidth: 300, margin: '16px auto' }}>
                <div className="progress-bar-fill" style={{ width: '60%', background: 'var(--gradient-primary)' }} />
              </div>
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Model info */}
              <div className="card" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>🤖</span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>AI Model Results</h3>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span className="badge badge-primary">{result.model}</span>
                  <span className="badge badge-success">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Summary */}
              <div className="card">
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>📝 Summary</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{result.analysis.summary}</p>
                <div style={{ marginTop: 12 }}>
                  <span className="badge" style={{
                    background: `${riskColors[result.analysis.riskLevel]}20`,
                    color: riskColors[result.analysis.riskLevel],
                    fontSize: '0.82rem', padding: '6px 14px'
                  }}>Risk Level: {result.analysis.riskLevel?.toUpperCase()}</span>
                </div>
              </div>

              {/* Findings */}
              <div className="card">
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>🔍 Findings</h4>
                {result.analysis.findings?.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < result.analysis.findings.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="card" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--success)' }}>💡 Recommendations</h4>
                {result.analysis.recommendations?.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
                    <span style={{ color: 'var(--secondary)' }}>→</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.4 }}>🧠</div>
              <h3 style={{ color: 'var(--text-secondary)' }}>Select a report type and run analysis</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>AI-powered analysis using YOLO v8 & OpenCV</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
