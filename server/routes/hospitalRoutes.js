const express = require('express');
const router = express.Router();
const h = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', h.getHospitals);
router.get('/:id', h.getHospital);
router.post('/smart-find', h.smartFind);
router.get('/:id/stats', protect, h.getHospitalStats);
router.post('/', protect, authorize('hospital_admin'), h.createHospital);
router.put('/:id/beds', protect, authorize('hospital_admin'), h.updateBeds);
router.put('/:id/crowd', protect, authorize('hospital_admin'), h.updateCrowd);

module.exports = router;
