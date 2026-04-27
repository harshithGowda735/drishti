import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { getSocket, joinHospitalRoom, leaveHospitalRoom } from '../../services/socket';
import * as api from '../../services/api';

const densityCfg = {
  low:       { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  label: 'Low',       emoji: '🟢' },
  moderate:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  label: 'Moderate',  emoji: '🟡' },
  high:      { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   label: 'High',      emoji: '🔴' },
  very_high: { color: '#dc2626', bg: 'rgba(220,38,38,0.15)',   label: 'Very High', emoji: '🚨' }
};

export default function CrowdMonitor({ user }) {
  const [hospital, setHospital] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [overallDensity, setOverallDensity] = useState('low');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [updateLog, setUpdateLog] = useState([]);
  const hospitalId = user?.hospitalId;
  const cardsRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (!hospitalId) return;
    fetchCrowdData();
  }, [hospitalId]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cameras.length > 0) {
        gsap.from(cardsRef.current?.children || [], { 
          scale: 0.9, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'back.out(1.2)' 
        });
      }
    });
    return () => ctx.revert();
  }, [cameras.length]);

  const fetchCrowdData = async () => {
    try {
      const res = await api.getHospital(hospitalId || '');
      if (res.data) {
        setHospital(res.data);
        setCameras(res.data.cameras || []);
        setTotalCount(res.data.crowdCount || 0);
        setOverallDensity(res.data.crowdDensity || 'low');
        setLastUpdated(res.data.crowdLastUpdated);
      }
    } catch {
      try {
        const res = await api.getHospitals();
        const h = res.data[0];
        if (h) {
          setHospital(h);
          setCameras(h.cameras || []);
          setTotalCount(h.crowdCount || 0);
          setOverallDensity(h.crowdDensity || 'low');
        }
      } catch {}
    }
  };

  useEffect(() => {
    if (!hospital?._id) return;

    const socket = getSocket();
    const hid = hospital._id;
    joinHospitalRoom(hid);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleCrowdUpdate = (data) => {
      if (data.hospitalId !== hid) return;

      setCameras(prev => prev.map(c =>
        c.cameraId === data.cameraId
          ? { ...c, peopleCount: data.peopleCount, density: data.density, lastUpdated: data.timestamp }
          : c
      ));

      setTotalCount(data.totalCount);
      setOverallDensity(data.overallDensity);
      setLastUpdated(data.timestamp);

      setUpdateLog(prev => [
        { time: new Date(data.timestamp).toLocaleTimeString(), zone: data.zone, count: data.peopleCount, density: data.density },
        ...prev.slice(0, 19)
      ]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('crowd_update', handleCrowdUpdate);
    setIsConnected(socket.connected);

    return () => {
      leaveHospitalRoom(hid);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('crowd_update', handleCrowdUpdate);
    };
  }, [hospital?._id]);

  const overall = densityCfg[overallDensity] || densityCfg.low;

  return (
    <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>👥 Crowd Monitoring</h1>
          <p>Real-time OpenCV + Haar Cascade People Analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#10b981' : '#ef4444', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isConnected ? '#10b981' : '#ef4444' }}>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="card-glass" style={{ marginBottom: 24, borderLeft: `5px solid ${overall.color}`, background: `linear-gradient(135deg, var(--bg-card), ${overall.bg})` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
               Current Facility Load — {hospital?.name || 'Monitoring...'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 900, color: overall.color }}>{totalCount}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>PEOPLE DETECTED</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 24px', borderRadius: 16, background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '2.5rem' }} className="float-anim">{overall.emoji}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: overall.color, textTransform: 'uppercase' }}>{overall.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CROWD DENSITY</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Camera Grid */}
        <div style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--primary-light)' }}>📷</span> Live Zone Feeds
          </h3>
          {cameras.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon">📷</div>
              <h3>No Active Camera Signals</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Waiting for computer vision service to initialize...</p>
            </div>
          ) : (
            <div ref={cardsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {cameras.map((cam) => {
                const cfg = densityCfg[cam.density] || densityCfg.low;
                return (
                  <div key={cam.cameraId} className="card" style={{ borderTop: `4px solid ${cfg.color}`, padding: 16 }}>
                    {/* Simulated camera feed */}
                    <div style={{ background: '#050810', borderRadius: 10, padding: '24px 16px', textAlign: 'center', marginBottom: 16, position: 'relative', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div className="scanline" />
                      <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6, zIndex: 1 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                        <span style={{ fontSize: '0.65rem', color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>{cam.cameraId} • LIVE</span>
                      </div>
                      
                      <div style={{ position: 'relative', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                        {Array.from({ length: Math.min(cam.peopleCount, 15) }).map((_, i) => (
                          <div key={i} style={{ width: 14, height: 26, border: '1px solid #00ff41', borderRadius: 4, background: 'rgba(0,255,65,0.05)', animation: 'fadeIn 0.5s ease' }} />
                        ))}
                        {cam.peopleCount > 15 && <span style={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.7rem' }}>+{cam.peopleCount - 15}</span>}
                      </div>
                      <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '0.6rem', color: '#555', fontFamily: 'monospace' }}>
                        {new Date(cam.lastUpdated || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{cam.zone}</h3>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontWeight: 800 }}>{cfg.label}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ background: 'var(--bg-surface)', padding: '12px 8px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: cfg.color }}>{cam.peopleCount}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>PEOPLE</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '12px 8px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: 8 }}>{cam.detectionModel || 'HOG+SVM'}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>CV MODEL</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Update Log */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--secondary)' }}>📜</span> Detection Log
          </h3>
          <div className="card-glass" style={{ padding: 0, maxHeight: 600, overflowY: 'auto' }} ref={logRef}>
            {updateLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div className="loading-spinner" style={{ width: 28, height: 28, marginBottom: 16 }} />
                Listening for real-time detections...
              </div>
            ) : (
              updateLog.map((log, i) => {
                const cfg = densityCfg[log.density] || densityCfg.low;
                return (
                  <div key={i} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < updateLog.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: '1.2rem' }}>{cfg.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{log.zone}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{log.time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: cfg.color }}>{log.count}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>COUNT</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
