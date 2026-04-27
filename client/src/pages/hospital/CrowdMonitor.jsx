import { useState, useEffect, useRef } from 'react';
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
  const logRef = useRef(null);

  // ─── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!hospitalId) return;
    fetchCrowdData();
  }, [hospitalId]);

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
      // If no hospitalId, load first hospital from list for demo
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

  // ─── Socket.io real-time subscription ──────────────────────────────────────
  useEffect(() => {
    if (!hospital?._id) return;

    const socket = getSocket();
    const hid = hospital._id;
    joinHospitalRoom(hid);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Per-camera crowd update from Python/YOLO service
    const handleCrowdUpdate = (data) => {
      if (data.hospitalId !== hid) return;

      // Update the specific camera
      setCameras(prev => prev.map(c =>
        c.cameraId === data.cameraId
          ? { ...c, peopleCount: data.peopleCount, density: data.density, lastUpdated: data.timestamp }
          : c
      ));

      setTotalCount(data.totalCount);
      setOverallDensity(data.overallDensity);
      setLastUpdated(data.timestamp);

      // Add to update log
      setUpdateLog(prev => [
        { time: new Date(data.timestamp).toLocaleTimeString(), zone: data.zone, count: data.peopleCount, density: data.density },
        ...prev.slice(0, 19)  // keep last 20 entries
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
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>👥 Crowd Monitoring</h1>
          <p>OpenCV + YOLOv8 real-time people detection — per camera zone</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#10b981' : '#ef4444', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isConnected ? '#10b981' : '#ef4444' }}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overall Summary */}
      <div className="card" style={{ marginBottom: 24, borderColor: `${overall.color}40`, background: `linear-gradient(135deg, var(--bg-card), ${overall.bg})` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {hospital?.name || 'Hospital'} — Total People Detected
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: '3rem', fontWeight: 900, color: overall.color }}>{totalCount}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>people across {cameras.length} camera{cameras.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>{overall.emoji}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: overall.color }}>{overall.label} Density</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(densityCfg).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', align: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, background: key === overallDensity ? cfg.bg : 'transparent', border: `1px solid ${key === overallDensity ? cfg.color : 'var(--border)'}` }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: key === overallDensity ? cfg.color : 'var(--text-muted)' }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Camera Grid */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>📷 Camera Zones — Live Feed</h3>
          {cameras.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📷</div>
              <h3>No cameras registered</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                Run the Python ML service to register cameras:<br />
                <code style={{ fontSize: '0.78rem', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>
                  python crowd_detector.py --hospital-id &lt;ID&gt; --camera-id CAM-01
                </code>
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {cameras.map((cam) => {
                const cfg = densityCfg[cam.density] || densityCfg.low;
                return (
                  <div key={cam.cameraId} className="card" style={{ borderColor: `${cfg.color}40` }}>
                    {/* Simulated camera feed */}
                    <div style={{ background: '#050810', borderRadius: 8, padding: '28px 20px', textAlign: 'center', marginBottom: 14, position: 'relative', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      {/* Scanline effect */}
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.02) 2px, rgba(0,255,0,0.02) 4px)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: cam.isActive ? '#ef4444' : '#666', animation: cam.isActive ? 'pulse 1.5s infinite' : 'none' }} />
                        <span style={{ fontSize: '0.65rem', color: '#aaa', fontFamily: 'monospace' }}>{cam.cameraId} • {cam.isActive ? 'REC' : 'OFF'}</span>
                      </div>
                      {/* Bounding box simulation */}
                      <div style={{ position: 'relative', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                        {Array.from({ length: Math.min(cam.peopleCount, 12) }).map((_, i) => (
                          <div key={i} style={{ width: 12, height: 22, border: '1px solid #00ff41', borderRadius: 2, background: 'rgba(0,255,65,0.08)', flexShrink: 0 }} />
                        ))}
                        {cam.peopleCount > 12 && (
                          <span style={{ fontSize: '0.65rem', color: '#00ff41', fontFamily: 'monospace' }}>+{cam.peopleCount - 12}</span>
                        )}
                      </div>
                      <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '0.6rem', color: '#555', fontFamily: 'monospace' }}>
                        {new Date(cam.lastUpdated || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{cam.zone}</h3>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: cfg.color }}>{cam.peopleCount}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>People</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 4 }}>{cam.detectionModel || 'HOG+SVM'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Model</div>
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
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>📋 Live Update Log</h3>
          <div className="card" style={{ padding: '12px 0', maxHeight: 500, overflowY: 'auto' }} ref={logRef}>
            {updateLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
                Waiting for YOLO detections...
              </div>
            ) : (
              updateLog.map((log, i) => {
                const cfg = densityCfg[log.density] || densityCfg.low;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: i < updateLog.length - 1 ? '1px solid var(--border)' : 'none', animation: i === 0 ? 'fadeIn 0.3s ease' : 'none' }}>
                    <span style={{ fontSize: '0.9rem' }}>{cfg.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{log.zone}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.time}</div>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: cfg.color }}>{log.count}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* ML Service Setup Card */}
          <div className="card" style={{ marginTop: 16, borderColor: 'rgba(99,102,241,0.3)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 10, color: 'var(--primary-light)' }}>🤖 Start ML Service</h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'monospace', background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
              <div style={{ color: '#64748b' }}># Install requirements</div>
              <div>pip install -r requirements.txt</div>
              <br />
              <div style={{ color: '#64748b' }}># Start detector for this hospital</div>
              <div>python crowd_detector.py \</div>
              <div>&nbsp;&nbsp;--hospital-id &lt;MONGO_ID&gt; \</div>
              <div>&nbsp;&nbsp;--camera-id CAM-01 \</div>
              <div>&nbsp;&nbsp;--zone "Main Entrance" \</div>
              <div>&nbsp;&nbsp;--source 0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
