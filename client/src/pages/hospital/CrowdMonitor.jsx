import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { getSocket, joinHospitalRoom, leaveHospitalRoom } from '../../services/socket';
import * as api from '../../services/api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [localCamCount, setLocalCamCount] = useState(0);
  const [stream, setStream] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    // Load AI Model
    cocoSsd.load().then(m => {
      setModel(m);
      console.log('🤖 AI Model Loaded');
    });
  }, []);

  useEffect(() => {
    if (!hospitalId) return;
    fetchCrowdData();
  }, [hospitalId]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray(cardsRef.current?.children || []);
      if (elements.length > 0) {
        gsap.fromTo(elements, { scale: 0.9, opacity: 0 }, { 
          scale: 1, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(1.2)' 
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

  const toggleScanner = async () => {
    if (scanning) {
      stream?.getTracks().forEach(track => track.stop());
      setScanning(false);
      setStream(null);
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        setScanning(true);
        startAutoScan();
      } catch (err) {
        alert("Camera access denied or not found");
      }
    }
  };

  const startAutoScan = () => {
    const interval = setInterval(async () => {
      if (!scanning || !model || !videoRef.current) {
        if (!scanning) clearInterval(interval);
        return;
      }

      try {
        // Real AI Detection
        const predictions = await model.detect(videoRef.current);
        const people = predictions.filter(p => p.class === 'person' && p.score > 0.5);
        const count = people.length;
        
        setLocalCamCount(count);
        
        // Update the backend
        if (hospital?._id) {
          // Standard Node.js Backend Update
          const zoneToUpdate = 'Waiting Room'; // Map scanner to Waiting Room
          api.updateCrowdData({
            hospitalId: hospital._id,
            cameraId: 'CAM-LAPTOP-01',
            zone: zoneToUpdate,
            peopleCount: count
          }).catch(() => {});

          // HealthConnect AI Intelligence Engine Sync (FastAPI)
          fetch(`http://localhost:8000/iot/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospital_id: hospital._id, count: count, zone: zoneToUpdate })
          }).catch(() => {});
        }

        // Draw detection boxes for demo effect
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.strokeStyle = '#00FF41';
          ctx.lineWidth = 4;
          ctx.fillStyle = '#00FF41';
          ctx.font = '18px Arial';

          people.forEach(p => {
            const [x, y, w, h] = p.bbox;
            ctx.strokeRect(x, y, w, h);
            ctx.fillText(`PERSON ${Math.round(p.score * 100)}%`, x, y > 20 ? y - 10 : 20);
          });
        }
      } catch (err) {
        console.error('AI Detection Error:', err);
      }
    }, 2000);
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
          <h1>👥 Live Crowd Analytics</h1>
          <p>Real-time AI Visual Intelligence & Zone Flow</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#10b981' : '#ef4444', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isConnected ? '#10b981' : '#ef4444' }}>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Live AI Scanner (New) */}
      <div className="card" style={{ marginBottom: 24, padding: 20, border: scanning ? '2px solid var(--danger)' : '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>🔬 Precision AI Hub (CCTV Mode)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Using Laptop Camera to simulate Clinic/Waiting Room CCTV Feed</p>
          </div>
          <button className={`btn ${scanning ? 'btn-danger' : 'btn-primary'}`} onClick={toggleScanner}>
            {scanning ? '🛑 Stop Scanner' : '📷 Start AI Scanner'}
          </button>
        </div>

        {scanning && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
             <span style={{ fontWeight: 800, color: 'var(--danger)' }}>⚠️ AI WEBCAM SCANNER ACTIVE:</span> Point your camera at people to see precision detection in the "Live Zone Feeds" grid below.
             {!model && <span style={{ marginLeft: 10, color: 'var(--warning)' }}>⌛ Loading AI Model...</span>}
          </div>
        )}
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
                    {/* Simulated or Real camera feed */}
                    <div style={{ background: '#050810', borderRadius: 10, padding: '24px 16px', textAlign: 'center', marginBottom: 16, position: 'relative', border: '1px solid var(--border)', overflow: 'hidden', height: 160 }}>
                      <div className="scanline" />
                      
                      {/* Show real webcam feed if it's the Admin Scanner cam */}
                      {scanning && cam.cameraId === 'CAM-LAPTOP-01' ? (
                        <div style={{ position: 'absolute', inset: 0 }}>
                          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                        </div>
                      ) : (
                        <div style={{ position: 'relative', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginTop: 20 }}>
                          {Array.from({ length: Math.min(cam.peopleCount, 15) }).map((_, i) => (
                            <div key={i} style={{ width: 14, height: 26, border: '1px solid #00ff41', borderRadius: 4, background: 'rgba(0,255,65,0.05)', animation: 'fadeIn 0.5s ease' }} />
                          ))}
                          {cam.peopleCount > 15 && <span style={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.7rem' }}>+{cam.peopleCount - 15}</span>}
                        </div>
                      )}

                      <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6, zIndex: 1, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                        <span style={{ fontSize: '0.65rem', color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>{cam.cameraId} • LIVE</span>
                      </div>
                      
                      <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '0.6rem', color: '#555', fontFamily: 'monospace', zIndex: 1 }}>
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
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: 8 }}>{cam.cameraId === 'CAM-LAPTOP-01' ? 'COCO-SSD (AI)' : 'Haar-Cascade'}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>CV ENGINE</div>
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
