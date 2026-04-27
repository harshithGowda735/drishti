const Hospital = require('../models/Hospital');

// Classify density based on people count
const classifyDensity = (count, capacity = 100) => {
  const ratio = count / capacity;
  if (ratio < 0.3) return 'low';
  if (ratio < 0.6) return 'moderate';
  if (ratio < 0.85) return 'high';
  return 'very_high';
};

// ─── Called by the Python ML service (per hospital, per camera) ──────────────
// POST /api/crowd/update
// Body: { hospitalId, cameraId, peopleCount, zone }
// Python service sends this after each YOLO detection frame
exports.updateCameraCount = async (req, res) => {
  try {
    const { hospitalId, cameraId, peopleCount, zone } = req.body;

    if (peopleCount === undefined || !hospitalId || !cameraId) {
      return res.status(400).json({ message: 'hospitalId, cameraId, and peopleCount are required' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    // Find or create the camera entry for this hospital
    let cam = hospital.cameras.find(c => c.cameraId === cameraId);
    if (!cam) {
      hospital.cameras.push({ cameraId, zone: zone || cameraId, peopleCount, isActive: true });
      cam = hospital.cameras[hospital.cameras.length - 1];
    } else {
      cam.peopleCount = peopleCount;
      cam.lastUpdated = new Date();
    }

    // Classify this camera's density
    cam.density = classifyDensity(peopleCount);

    // Recalculate total crowd count across ALL cameras for this hospital
    const totalCount = hospital.cameras
      .filter(c => c.isActive)
      .reduce((sum, c) => sum + c.peopleCount, 0);

    hospital.crowdCount = totalCount;
    hospital.crowdDensity = classifyDensity(totalCount, hospital.cameras.length * 50 || 100);
    hospital.crowdLastUpdated = new Date();
    hospital.mlServiceActive = true;

    await hospital.save();

    // ── Emit real-time update via Socket.io ───────────────────────────────
    const io = req.app.get('io');
    if (io) {
      // Broadcast to hospital-specific room + global dashboard
      io.to(`hospital_${hospitalId}`).emit('crowd_update', {
        hospitalId,
        cameraId,
        zone: cam.zone,
        peopleCount,
        density: cam.density,
        totalCount: hospital.crowdCount,
        overallDensity: hospital.crowdDensity,
        timestamp: new Date()
      });
      // Global broadcast so patient-facing smart-finder can update
      io.emit('hospital_status_update', {
        hospitalId,
        crowdCount: hospital.crowdCount,
        crowdDensity: hospital.crowdDensity,
        beds: hospital.beds,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Crowd count updated',
      cameraId, zone: cam.zone, peopleCount,
      totalCount: hospital.crowdCount,
      density: hospital.crowdDensity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Register a new camera for a hospital ────────────────────────────────────
// POST /api/crowd/register-camera
exports.registerCamera = async (req, res) => {
  try {
    const { hospitalId, cameraId, zone, streamUrl, detectionModel } = req.body;

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const exists = hospital.cameras.find(c => c.cameraId === cameraId);
    if (exists) return res.status(400).json({ message: 'Camera already registered' });

    hospital.cameras.push({
      cameraId,
      zone: zone || 'Unnamed Zone',
      streamUrl: streamUrl || '',
      detectionModel: detectionModel || 'YOLOv8n',
      peopleCount: 0,
      density: 'low',
      isActive: true
    });
    await hospital.save();

    res.status(201).json({ message: 'Camera registered', camera: hospital.cameras.slice(-1)[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get live crowd data for a hospital (all cameras) ────────────────────────
// GET /api/crowd/:hospitalId
exports.getHospitalCrowd = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId)
      .select('name crowdCount crowdDensity crowdLastUpdated cameras mlServiceActive');
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update bed count in real time ───────────────────────────────────────────
// PUT /api/crowd/:hospitalId/beds
exports.updateBeds = async (req, res) => {
  try {
    const { ward, action } = req.body; // ward: 'general'|'icu'|'emergency', action: 'admit'|'discharge'
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const w = hospital.beds[ward];
    if (!w) return res.status(400).json({ message: `Unknown ward: ${ward}` });

    if (action === 'admit') {
      if (w.available <= 0) return res.status(400).json({ message: 'No beds available in this ward' });
      w.available -= 1;
      hospital.beds.available = Math.max(0, hospital.beds.available - 1);
    } else if (action === 'discharge') {
      if (w.available >= w.total) return res.status(400).json({ message: 'Ward already at full capacity' });
      w.available += 1;
      hospital.beds.available += 1;
    }

    await hospital.save();

    // Emit real-time bed update
    const io = req.app.get('io');
    if (io) {
      io.to(`hospital_${req.params.hospitalId}`).emit('beds_update', {
        hospitalId: req.params.hospitalId,
        beds: hospital.beds,
        ward, action,
        timestamp: new Date()
      });
      io.emit('hospital_status_update', {
        hospitalId: req.params.hospitalId,
        crowdCount: hospital.crowdCount,
        crowdDensity: hospital.crowdDensity,
        beds: hospital.beds,
        timestamp: new Date()
      });
    }

    res.json({ message: `Bed ${action}ted in ${ward}`, beds: hospital.beds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get all hospitals with live status (for smart-finder) ───────────────────
// GET /api/crowd/all-status
exports.getAllStatus = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true })
      .select('name address beds crowdCount crowdDensity crowdLastUpdated mlServiceActive rating emergencyServices');
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
