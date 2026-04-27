const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  role: { type: String, enum: ['patient', 'hospital_admin', 'asha_worker', 'doctor'], default: 'patient' },
  avatar: { type: String, default: '' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  // Patient-specific
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''] },
  dateOfBirth: Date,
  emergencyContact: { name: String, phone: String, relation: String },
  allergies: [String],
  chronicConditions: [String],
  // ASHA-specific
  assignedArea: String,
  assignedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Hospital admin-specific
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  // Common
  notifications: [{
    title: String,
    message: String,
    type: { type: String, enum: ['info', 'warning', 'emergency', 'reminder'] },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
