const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, enum: ['government', 'private', 'clinic', 'phc'], default: 'government' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  departments: [{
    name: String,
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  beds: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    icu: { total: { type: Number, default: 0 }, available: { type: Number, default: 0 } },
    general: { total: { type: Number, default: 0 }, available: { type: Number, default: 0 } },
    emergency: { total: { type: Number, default: 0 }, available: { type: Number, default: 0 } }
  },

  // ─── Real-time Crowd Detection ───────────────────────────────────────────
  crowdDensity: { type: String, enum: ['low', 'moderate', 'high', 'very_high'], default: 'low' },
  crowdCount: { type: Number, default: 0 },
  crowdLastUpdated: { type: Date, default: Date.now },

  // Per-hospital camera zones (each hospital registers its own cameras)
  cameras: [{
    cameraId: { type: String, required: true },       // unique ID like "CAM-HOSP1-01"
    zone: { type: String, required: true },            // e.g. "Main Entrance"
    streamUrl: { type: String, default: '' },          // RTSP / webcam URL
    peopleCount: { type: Number, default: 0 },
    density: { type: String, enum: ['low', 'moderate', 'high', 'very_high'], default: 'low' },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
    detectionModel: { type: String, default: 'HOG+SVM' }  // OpenCV built-in
  }],

  // ML service connection for this hospital
  mlServiceUrl: { type: String, default: '' },        // URL to this hospital's Python service
  mlServiceActive: { type: Boolean, default: false },

  // ─────────────────────────────────────────────────────────────────────────
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  facilities: [String],
  emergencyServices: { type: Boolean, default: true },
  ambulanceAvailable: { type: Boolean, default: true },
  operatingHours: {
    open: { type: String, default: '00:00' },
    close: { type: String, default: '23:59' },
    is24x7: { type: Boolean, default: true }
  },
  images: [String],
  isVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

hospitalSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
