const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');

// @desc    Book appointment
// @route   POST /api/appointments
exports.bookAppointment = async (req, res) => {
  try {
    const { hospital, department, date, timeSlot, type, symptoms, notes, doctor } = req.body;
    console.log(`📅 Booking attempt: Patient ${req.user._id}, Hospital ${hospital}, Slot ${timeSlot}`);

    // Ensure date is a proper Date object and stripped of time if only date is provided
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Build conflict query dynamically
    const conflictQuery = {
      hospital,
      date: {
        $gte: bookingDate,
        $lt: new Date(bookingDate.getTime() + 86400000)
      },
      timeSlot,
      status: { $nin: ['cancelled', 'no_show'] }
    };
    
    // Only include doctor if provided
    if (doctor && doctor !== '') {
      conflictQuery.doctor = doctor;
    }

    // Check for time slot conflicts
    const existing = await Appointment.findOne(conflictQuery);
    
    if (existing) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const priority = type === 'emergency' ? 1 : type === 'follow_up' ? 2 : 3;

    const appointment = await Appointment.create({
      patient: req.user._id,
      hospital,
      department,
      date: bookingDate,
      timeSlot,
      type,
      symptoms: symptoms || [],
      notes: notes || '',
      doctor: (doctor && doctor !== '') ? doctor : undefined,
      priority,
      bookedBy: req.body.bookedBy || 'self',
      ashaWorker: req.body.ashaWorker
    });

    const populated = await appointment.populate([
      { path: 'hospital', select: 'name address phone' },
      { path: 'patient', select: 'name phone email' }
    ]);

    console.log(`✅ Appointment booked: ${appointment._id}`);
    
    // Emit real-time update to hospital
    const io = req.app.get('io');
    if (io) {
      io.to(`hospital_${hospital}`).emit('appointment_update', {
        type: 'new_booking',
        appointment: populated
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error(`❌ Booking Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments/my
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('hospital', 'name address phone type')
      .populate('doctor', 'name phone')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hospital's appointments
// @route   GET /api/appointments/hospital/:hospitalId
exports.getHospitalAppointments = async (req, res) => {
  try {
    const { status, type, date } = req.query;
    let query = { hospital: req.params.hospitalId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name phone email bloodGroup')
      .populate('doctor', 'name phone')
      .sort({ priority: 1, date: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = req.body.status;
    if (req.body.diagnosis) appointment.diagnosis = req.body.diagnosis;
    if (req.body.prescription) appointment.prescription = req.body.prescription;
    if (req.body.vitals) appointment.vitals = req.body.vitals;
    if (req.body.followUpDate) appointment.followUpDate = req.body.followUpDate;

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available time slots
// @route   GET /api/appointments/slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { hospitalId, date, department } = req.query;
    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

    const d = new Date(date);
    const booked = await Appointment.find({
      hospital: hospitalId,
      date: { $gte: d, $lt: new Date(d.getTime() + 86400000) },
      department,
      status: { $nin: ['cancelled', 'no_show'] }
    }).select('timeSlot');

    const bookedSlots = booked.map(a => a.timeSlot);
    const available = allSlots.filter(s => !bookedSlots.includes(s));

    res.json({ available, booked: bookedSlots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Emergency request
// @route   POST /api/appointments/emergency
exports.emergencyRequest = async (req, res) => {
  try {
    const { lat, lng, symptoms, notes } = req.body;
    
    // Find nearest hospital with emergency services
    const hospitals = await Hospital.find({ emergencyServices: true, isActive: true });
    
    let nearest = null;
    let minDist = Infinity;
    hospitals.forEach(h => {
      const dlat = (h.address.coordinates.lat - (lat || 0)) * 111;
      const dlng = (h.address.coordinates.lng - (lng || 0)) * 111;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);
      if (dist < minDist && h.beds.available > 0) {
        minDist = dist;
        nearest = h;
      }
    });

    if (!nearest) {
      return res.status(404).json({ message: 'No available emergency hospital found nearby' });
    }

    const now = new Date();
    const appointment = await Appointment.create({
      patient: req.user._id,
      hospital: nearest._id,
      department: 'Emergency',
      date: now,
      timeSlot: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      type: 'emergency',
      priority: 1,
      status: 'confirmed',
      symptoms: symptoms || [],
      notes: notes || 'Emergency request'
    });

    res.status(201).json({
      appointment,
      hospital: nearest,
      distance: Math.round(minDist * 10) / 10,
      estimatedTime: `${Math.round(minDist * 3)} mins`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
