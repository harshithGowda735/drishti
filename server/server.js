const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hospitals', require('./routes/hospitalRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Healthcare Platform API is running', timestamp: new Date() });
});

// Seed endpoint (for demo purposes)
app.post('/api/seed', async (req, res) => {
  try {
    const Hospital = require('./models/Hospital');
    const count = await Hospital.countDocuments();
    if (count > 0) return res.json({ message: 'Data already seeded', count });

    const hospitals = [
      {
        name: 'City General Hospital', email: 'city@hospital.com', phone: '9876543210', type: 'government',
        address: { street: 'MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', coordinates: { lat: 12.9716, lng: 77.5946 } },
        beds: { total: 500, available: 120, icu: { total: 50, available: 12 }, general: { total: 350, available: 85 }, emergency: { total: 100, available: 23 } },
        crowdDensity: 'moderate', crowdCount: 145, rating: 4.3, facilities: ['ICU', 'Emergency', 'Surgery', 'Pharmacy', 'Lab', 'Radiology', 'Blood Bank'], departments: [{ name: 'General Medicine' }, { name: 'Surgery' }, { name: 'Pediatrics' }, { name: 'Orthopedics' }, { name: 'Cardiology' }]
      },
      {
        name: 'LifeCare Private Hospital', email: 'life@hospital.com', phone: '9876543211', type: 'private',
        address: { street: 'Residency Road', city: 'Bangalore', state: 'Karnataka', pincode: '560025', coordinates: { lat: 12.9756, lng: 77.6070 } },
        beds: { total: 300, available: 85, icu: { total: 40, available: 8 }, general: { total: 200, available: 60 }, emergency: { total: 60, available: 17 } },
        crowdDensity: 'low', crowdCount: 67, rating: 4.7, facilities: ['ICU', 'Emergency', 'Surgery', 'Pharmacy', 'Lab', 'MRI', 'CT Scan'], departments: [{ name: 'General Medicine' }, { name: 'Neurology' }, { name: 'Cardiology' }, { name: 'Oncology' }]
      },
      {
        name: 'Rural Health Center', email: 'rural@hospital.com', phone: '9876543212', type: 'phc',
        address: { street: 'Village Road', city: 'Mandya', state: 'Karnataka', pincode: '571401', coordinates: { lat: 12.5218, lng: 76.8951 } },
        beds: { total: 50, available: 30, icu: { total: 5, available: 3 }, general: { total: 35, available: 22 }, emergency: { total: 10, available: 5 } },
        crowdDensity: 'low', crowdCount: 12, rating: 3.8, facilities: ['Emergency', 'Pharmacy', 'Lab'], departments: [{ name: 'General Medicine' }, { name: 'Pediatrics' }]
      },
      {
        name: 'Metro Multispecialty Hospital', email: 'metro@hospital.com', phone: '9876543213', type: 'private',
        address: { street: 'HSR Layout', city: 'Bangalore', state: 'Karnataka', pincode: '560102', coordinates: { lat: 12.9121, lng: 77.6446 } },
        beds: { total: 400, available: 45, icu: { total: 60, available: 5 }, general: { total: 250, available: 30 }, emergency: { total: 90, available: 10 } },
        crowdDensity: 'high', crowdCount: 234, rating: 4.5, facilities: ['ICU', 'Emergency', 'Surgery', 'Pharmacy', 'Lab', 'MRI', 'Transplant Unit'], departments: [{ name: 'Cardiology' }, { name: 'Neurosurgery' }, { name: 'Oncology' }, { name: 'Transplant' }]
      },
      {
        name: 'Community Clinic', email: 'comm@clinic.com', phone: '9876543214', type: 'clinic',
        address: { street: 'Jayanagar', city: 'Bangalore', state: 'Karnataka', pincode: '560041', coordinates: { lat: 12.9299, lng: 77.5838 } },
        beds: { total: 20, available: 12, icu: { total: 0, available: 0 }, general: { total: 15, available: 10 }, emergency: { total: 5, available: 2 } },
        crowdDensity: 'low', crowdCount: 8, rating: 4.0, facilities: ['Pharmacy', 'Lab'], emergencyServices: false, departments: [{ name: 'General Medicine' }, { name: 'Dentistry' }]
      }
    ];

    await Hospital.insertMany(hospitals);
    res.json({ message: 'Seed data created', count: hospitals.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🏥 Healthcare Platform API running on port ${PORT}`);
});
