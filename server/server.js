const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Client joins a hospital-specific room to get that hospital's updates
  socket.on('join_hospital', (hospitalId) => {
    socket.join(`hospital_${hospitalId}`);
    console.log(`📡 Socket ${socket.id} joined hospital_${hospitalId}`);
  });

  // Client leaves hospital room
  socket.on('leave_hospital', (hospitalId) => {
    socket.leave(`hospital_${hospitalId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hospitals', require('./routes/hospitalRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/crowd', require('./routes/crowdRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'HealthConnect API running',
    realtime: 'Socket.io active',
    mlService: 'OpenCV/YOLO endpoint ready at POST /api/crowd/update',
    timestamp: new Date()
  });
});

// ─── Seed Demo Data ───────────────────────────────────────────────────────────
app.post('/api/seed', async (req, res) => {
  try {
    const Hospital = require('./models/Hospital');
    const count = await Hospital.countDocuments();
    if (count > 0) return res.json({ message: 'Data already seeded', count });

    const hospitals = [
      {
        name: 'City General Hospital',
        email: 'city@hospital.com', phone: '9876543210', type: 'government',
        address: { street: 'MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', coordinates: { lat: 12.9716, lng: 77.5946 } },
        beds: { total: 500, available: 120, icu: { total: 50, available: 12 }, general: { total: 350, available: 85 }, emergency: { total: 100, available: 23 } },
        crowdDensity: 'moderate', crowdCount: 145, rating: 4.3,
        facilities: ['ICU', 'Emergency', 'Surgery', 'Pharmacy', 'Lab', 'Radiology', 'Blood Bank'],
        departments: [{ name: 'General Medicine' }, { name: 'Surgery' }, { name: 'Pediatrics' }, { name: 'Orthopedics' }, { name: 'Cardiology' }],
        cameras: [
          { cameraId: 'CAM-CGH-01', zone: 'Main Entrance', peopleCount: 45, density: 'moderate' },
          { cameraId: 'CAM-CGH-02', zone: 'Emergency Wing', peopleCount: 23, density: 'moderate' },
          { cameraId: 'CAM-CGH-03', zone: 'OPD Area', peopleCount: 77, density: 'high' }
        ]
      },
      {
        name: 'LifeCare Private Hospital',
        email: 'life@hospital.com', phone: '9876543211', type: 'private',
        address: { street: 'Residency Road', city: 'Bangalore', state: 'Karnataka', pincode: '560025', coordinates: { lat: 12.9756, lng: 77.6070 } },
        beds: { total: 300, available: 85, icu: { total: 40, available: 8 }, general: { total: 200, available: 60 }, emergency: { total: 60, available: 17 } },
        crowdDensity: 'low', crowdCount: 67, rating: 4.7,
        facilities: ['ICU', 'Emergency', 'Surgery', 'Pharmacy', 'Lab', 'MRI', 'CT Scan'],
        departments: [{ name: 'General Medicine' }, { name: 'Neurology' }, { name: 'Cardiology' }, { name: 'Oncology' }],
        cameras: [
          { cameraId: 'CAM-LPH-01', zone: 'Reception', peopleCount: 18, density: 'low' },
          { cameraId: 'CAM-LPH-02', zone: 'OPD', peopleCount: 49, density: 'moderate' }
        ]
      },
      {
        name: 'Rural Health Center',
        email: 'rural@hospital.com', phone: '9876543212', type: 'phc',
        address: { street: 'Village Road', city: 'Mandya', state: 'Karnataka', pincode: '571401', coordinates: { lat: 12.5218, lng: 76.8951 } },
        beds: { total: 50, available: 30, icu: { total: 5, available: 3 }, general: { total: 35, available: 22 }, emergency: { total: 10, available: 5 } },
        crowdDensity: 'low', crowdCount: 12, rating: 3.8,
        facilities: ['Emergency', 'Pharmacy', 'Lab'],
        departments: [{ name: 'General Medicine' }, { name: 'Pediatrics' }],
        cameras: [
          { cameraId: 'CAM-RHC-01', zone: 'Waiting Area', peopleCount: 12, density: 'low' }
        ]
      },
      {
        name: 'Metro Multispecialty Hospital',
        email: 'metro@hospital.com', phone: '9876543213', type: 'private',
        address: { street: 'HSR Layout', city: 'Bangalore', state: 'Karnataka', pincode: '560102', coordinates: { lat: 12.9121, lng: 77.6446 } },
        beds: { total: 400, available: 45, icu: { total: 60, available: 5 }, general: { total: 250, available: 30 }, emergency: { total: 90, available: 10 } },
        crowdDensity: 'high', crowdCount: 234, rating: 4.5,
        facilities: ['ICU', 'Emergency', 'Surgery', 'Pharmacy', 'Lab', 'MRI', 'Transplant Unit'],
        departments: [{ name: 'Cardiology' }, { name: 'Neurosurgery' }, { name: 'Oncology' }, { name: 'Transplant' }],
        cameras: [
          { cameraId: 'CAM-MMH-01', zone: 'Main Entrance', peopleCount: 89, density: 'high' },
          { cameraId: 'CAM-MMH-02', zone: 'Emergency', peopleCount: 56, density: 'high' },
          { cameraId: 'CAM-MMH-03', zone: 'OPD Floor 1', peopleCount: 89, density: 'high' }
        ]
      },
      {
        name: 'Community Clinic',
        email: 'comm@clinic.com', phone: '9876543214', type: 'clinic',
        address: { street: 'Jayanagar', city: 'Bangalore', state: 'Karnataka', pincode: '560041', coordinates: { lat: 12.9299, lng: 77.5838 } },
        beds: { total: 20, available: 12, icu: { total: 0, available: 0 }, general: { total: 15, available: 10 }, emergency: { total: 5, available: 2 } },
        crowdDensity: 'low', crowdCount: 8, rating: 4.0,
        facilities: ['Pharmacy', 'Lab'], emergencyServices: false,
        departments: [{ name: 'General Medicine' }, { name: 'Dentistry' }],
        cameras: [
          { cameraId: 'CAM-CC-01', zone: 'Waiting Room', peopleCount: 8, density: 'low' }
        ]
      }
    ];

    await Hospital.insertMany(hospitals);
    res.json({ message: 'Seed data created', count: hospitals.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🏥 HealthConnect API running on port ${PORT}`);
  console.log(`🔌 Socket.io real-time enabled`);
  console.log(`🤖 ML crowd endpoint: POST http://localhost:${PORT}/api/crowd/update`);
});
