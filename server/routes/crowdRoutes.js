const express = require('express');
const router = express.Router();
const c = require('../controllers/crowdController');
const { protect, authorize } = require('../middleware/auth');

// Python ML service sends updates here (no auth required — secured by API key in production)
router.post('/update', c.updateCameraCount);

// Hospital admin registers cameras
router.post('/register-camera', protect, authorize('hospital_admin'), c.registerCamera);

// Get live crowd data for a specific hospital
router.get('/:hospitalId', protect, c.getHospitalCrowd);

// Update beds in real time
router.put('/:hospitalId/beds', protect, authorize('hospital_admin', 'doctor'), c.updateBeds);

// Get all hospitals live status (public, for smart-finder)
router.get('/all-status', c.getAllStatus);

module.exports = router;
