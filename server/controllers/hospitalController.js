const Hospital = require('../models/Hospital');

// @desc    Get all hospitals (with optional filters)
// @route   GET /api/hospitals
exports.getHospitals = async (req, res) => {
  try {
    const { city, type, emergency, search, sortBy } = req.query;
    let query = { isActive: true };

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (type) query.type = type;
    if (emergency === 'true') query.emergencyServices = true;
    if (search) query.name = new RegExp(search, 'i');

    let sortOption = { rating: -1 };
    if (sortBy === 'beds') sortOption = { 'beds.available': -1 };
    if (sortBy === 'crowd') sortOption = { crowdCount: 1 };

    const hospitals = await Hospital.find(query).sort(sortOption);
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hospital
// @route   GET /api/hospitals/:id
exports.getHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Smart hospital finder (distance + beds + crowd)
// @route   POST /api/hospitals/smart-find
exports.smartFind = async (req, res) => {
  try {
    const { lat, lng, emergency, department } = req.body;
    let query = { isActive: true };
    if (emergency) query.emergencyServices = true;

    const hospitals = await Hospital.find(query);
    
    // Calculate scores based on distance, bed availability, crowd density
    const scored = hospitals.map(h => {
      const dlat = (h.address.coordinates.lat - (lat || 0)) * 111;
      const dlng = (h.address.coordinates.lng - (lng || 0)) * 111 * Math.cos((lat || 0) * Math.PI / 180);
      const distance = Math.sqrt(dlat * dlat + dlng * dlng);

      const crowdScore = { low: 1, moderate: 0.7, high: 0.4, very_high: 0.1 }[h.crowdDensity] || 0.5;
      const bedScore = h.beds.total > 0 ? h.beds.available / h.beds.total : 0;
      const distScore = Math.max(0, 1 - distance / 50);

      const totalScore = (distScore * 0.4) + (bedScore * 0.35) + (crowdScore * 0.25);

      return { ...h.toObject(), distance: Math.round(distance * 10) / 10, score: Math.round(totalScore * 100) };
    });

    scored.sort((a, b) => b.score - a.score);
    res.json(scored.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update bed availability
// @route   PUT /api/hospitals/:id/beds
exports.updateBeds = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const { beds } = req.body;
    if (beds) {
      hospital.beds = { ...hospital.beds.toObject(), ...beds };
    }
    await hospital.save();
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update crowd density
// @route   PUT /api/hospitals/:id/crowd
exports.updateCrowd = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    hospital.crowdDensity = req.body.density || 'moderate';
    hospital.crowdCount = req.body.count || 0;
    await hospital.save();
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create hospital (admin only)
// @route   POST /api/hospitals
exports.createHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hospital stats
// @route   GET /api/hospitals/:id/stats
exports.getHospitalStats = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    
    const Appointment = require('../models/Appointment');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = await Appointment.countDocuments({
      hospital: req.params.id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });

    const pendingEmergencies = await Appointment.countDocuments({
      hospital: req.params.id,
      type: 'emergency',
      status: { $in: ['pending', 'confirmed'] }
    });

    res.json({
      beds: hospital.beds,
      crowdDensity: hospital.crowdDensity,
      crowdCount: hospital.crowdCount,
      todayAppointments,
      pendingEmergencies,
      rating: hospital.rating
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
