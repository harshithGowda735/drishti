const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  type: { type: String, enum: ['lab_report', 'prescription', 'imaging', 'discharge_summary', 'vaccination', 'surgery', 'other'], required: true },
  title: { type: String, required: true },
  description: String,
  fileUrl: String,
  results: mongoose.Schema.Types.Mixed,
  aiAnalysis: {
    summary: String,
    findings: [String],
    riskLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'] },
    recommendations: [String],
    analyzedAt: Date
  },
  tags: [String],
  isSharedWithAsha: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
