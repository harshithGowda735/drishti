import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

export default function UserDashboard({ user }) {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const bannerRef = useRef(null);
  const actionsRef = useRef(null);
  const summaryRef = useRef(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [medicalInfo, setMedicalInfo] = useState('');
  const [aiPlan, setAiPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const onboardingRef = useRef(null);
  const [hasPlan, setHasPlan] = useState(localStorage.getItem('userHealthPlan') !== null);
  const [dismissed, setDismissed] = useState(localStorage.getItem('dismissedHealthOnboarding') === 'true');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySummary, setHistorySummary] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const plan = JSON.parse(localStorage.getItem('userHealthPlan') || 'null');
    if (plan) setAiPlan(plan);
    else if (!dismissed) setShowOnboarding(true);
  }, [dismissed]);

  const handleSkip = () => {
    localStorage.setItem('dismissedHealthOnboarding', 'true');
    setDismissed(true);
    setShowOnboarding(false);
  };

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { force3D: true } });
      tl.fromTo(bannerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' })
        .fromTo(actionsRef.current?.children || [], { y: 15, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.35, ease: 'power2.out' }, '-=0.25')
        .fromTo(summaryRef.current?.children || [], { y: 15, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    });
    return () => ctx.revert();
  }, []);

  const quickActions = [
    { icon: '🏥', title: 'Find Hospital', desc: 'Smart search with AI', path: '/user/hospitals', color: '#6366f1' },
    { icon: '📅', title: 'Book Appointment', desc: 'Real-time slot booking', path: '/user/hospitals', color: '#06b6d4' },
    { icon: '🚑', title: 'Emergency', desc: 'One-click SOS help', path: '/user/emergency', color: '#ef4444' },
    { icon: '🧠', title: 'AI Analysis', desc: 'Upload & analyze reports', path: '/user/ai-analysis', color: '#10b981' },
    { icon: '📋', title: 'My Records', desc: 'View medical history', path: '/user/records', color: '#f59e0b' },
    { icon: '📅', title: 'Appointments', desc: 'View upcoming visits', path: '/user/appointments', color: '#8b5cf6' },
  ];

  const healthTips = [
    { icon: '💊', tip: 'Take medications on time', time: '8:00 AM' },
    { icon: '🥗', tip: 'Eat a balanced breakfast', time: '9:00 AM' },
    { icon: '🏃', tip: '30 min walk recommended', time: '6:00 PM' },
    { icon: '💤', tip: 'Sleep 7-8 hours tonight', time: '10:00 PM' },
  ];

  const handleSaveHealthProfile = async () => {
    if (!medicalInfo) return;
    setLoading(true);
    try {
      const res = await api.analyzeReport({ 
        reportType: 'General Health Profile', 
        reportDetails: medicalInfo 
      });
      setAiPlan(res.data);
      localStorage.setItem('userHealthPlan', JSON.stringify(res.data));
      setShowOnboarding(false);
      setHasPlan(true);
    } catch (err) {
      alert('Failed to generate health plan. Please try again.');
    }
    setLoading(false);
  };

  const handleViewHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      // Simulate fetching history and generating summary for demo
      // In a real app, we'd fetch actual records and pass to AI
      const res = await api.analyzeReport({ 
        reportType: 'Full Medical History Summary', 
        reportDetails: 'User has had 3 appointments in the last month for blood pressure monitoring. Vitals have been stable at 120/80.' 
      });
      setHistorySummary(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingHistory(false);
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      {/* Detailed History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>📊 Medical History Summary</h2>
              <button className="btn btn-ghost" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>
            
            {loadingHistory ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Generating AI Summary Report...</p>
              </div>
            ) : historySummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ background: 'var(--bg-surface)', borderLeft: '4px solid var(--primary)' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: 8 }}>Gemma 3 Analysis</h4>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{historySummary.insights}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
                    <div style={{ fontWeight: 800, color: 'var(--success)' }}>STABLE</div>
                  </div>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Risk Level</div>
                    <div style={{ fontWeight: 800, color: 'var(--warning)' }}>{historySummary.riskLevel?.toUpperCase()}</div>
                  </div>
                </div>
                <div className="card">
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 8 }}>💡 Key Recommendations</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{historySummary.foodRoutine}</p>
                </div>
                <button className="btn btn-primary btn-block" onClick={() => setShowHistoryModal(false)}>Close Report</button>
              </div>
            ) : (
              <p>No history available to summarize.</p>
            )}
          </div>
        </div>
      )}
      {/* AI Onboarding Modal */}
      {showOnboarding && !hasPlan && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div ref={onboardingRef} className="modal" style={{ maxWidth: 450, textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🏥</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Complete Your Health Profile</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
              Tell us about any symptoms or medical history so Gemma 3 AI can suggest the best food and exercise plan for you.
            </p>
            <textarea 
              className="input-field" 
              placeholder="e.g. I have diabetes and high blood pressure..."
              style={{ minHeight: 120, marginBottom: 20, resize: 'none' }}
              value={medicalInfo}
              onChange={e => setMedicalInfo(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleSkip}>Maybe Later</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSaveHealthProfile} disabled={loading}>
                {loading ? 'Consulting AI...' : 'Generate My Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div ref={bannerRef} className="card-glass" style={{
        background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', padding: '32px 28px',
        marginBottom: 28, position: 'relative', overflow: 'hidden', border: 'none'
      }}>
        {/* ... existing banner content ... */}
        <div className="float-anim" style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div className="float-anim-rev" style={{ position: 'absolute', bottom: -40, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, fontWeight: 600 }}>{greeting} 👋</p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '4px 0 8px', color: '#fff' }}>{user?.name || 'Patient'}</h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Welcome to your health dashboard. Your health, our priority.</p>
        </div>
      </div>

      {/* AI Health Plan (New) */}
      {aiPlan && (
        <div className="stagger" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#10b981' }}>✨</span> Personalized AI Health Plan
          </h2>
          <div className="card-glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, padding: 24, border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ borderLeft: '4px solid #10b981', paddingLeft: 16 }}>
              <h4 style={{ color: '#10b981', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>🥗 Food Routine</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{aiPlan.foodRoutine}</p>
            </div>
            <div style={{ borderLeft: '4px solid #0ea5e9', paddingLeft: 16 }}>
              <h4 style={{ color: '#0ea5e9', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>🚶 Walk & Activity</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{aiPlan.walkRoutine}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--accent)' }}>⚡</span> Quick Actions
      </h2>
      <div ref={actionsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        {quickActions.map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)}
            className="card"
            style={{
              textAlign: 'left', cursor: 'pointer', transition: 'var(--transition)',
              display: 'flex', flexDirection: 'column', gap: 10, borderBottom: `3px solid ${a.color}40`
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: a.color }}>
              {a.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{a.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Two Column Section */}
      <div ref={summaryRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Reminders */}
        <div className="stagger">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--primary-light)' }}>🔔</span> Today's Reminders
          </h2>
          <div className="card" style={{ padding: '0 20px' }}>
            {healthTips.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0',
                borderBottom: i < healthTips.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ fontSize: '1.5rem', background: 'var(--bg-surface)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.tip}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.time}</div>
                </div>
                <span className="badge badge-info" style={{ borderRadius: 6 }}>Upcoming</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Summary */}
        <div className="stagger">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--success)' }}>📊</span> Health Summary
          </h2>
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {[
                { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'Normal', color: 'var(--success)', icon: '🩺' },
                { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'Normal', color: 'var(--success)', icon: '❤️' },
                { label: 'Blood Sugar', value: '98', unit: 'mg/dL', status: 'Normal', color: 'var(--success)', icon: '🩸' },
                { label: 'SpO2', value: '98', unit: '%', status: 'Normal', color: 'var(--success)', icon: '🫁' },
              ].map((v, i) => (
                <div key={i} style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '1.1rem' }}>{v.icon}</span>
                    <span style={{ fontSize: '0.65rem', color: v.color, fontWeight: 700, textTransform: 'uppercase' }}>{v.status}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{v.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                    {v.value} 
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-sm btn-block" style={{ marginTop: 16 }} onClick={handleViewHistory}>
              View Detailed History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
