const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  doctor: { type: mongoose.Schema.Types.Mixed }, // Can be ObjectId or String for demo
  department: { type: String, required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  type: { type: String, enum: ['regular', 'emergency', 'follow_up', 'consultation'], default: 'regular' },
  status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'pending' },
  priority: { type: Number, default: 3, min: 1, max: 5 }, // 1=highest
  symptoms: [String],
  notes: String,
  diagnosis: String,
  prescription: [{
    medicine: String,
    dosage: String,
    duration: String,
    frequency: String
  }],
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    oxygenLevel: Number,
    weight: Number
  },
  bookedBy: { type: String, enum: ['self', 'asha_worker', 'hospital'], default: 'self' },
  ashaWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  followUpDate: Date,
  fee: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
