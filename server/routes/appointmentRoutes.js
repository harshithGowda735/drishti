const express = require('express');
const router = express.Router();
const a = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

router.post('/', protect, a.bookAppointment);
router.get('/my', protect, a.getMyAppointments);
router.get('/slots', a.getAvailableSlots);
router.post('/emergency', protect, a.emergencyRequest);
router.get('/hospital/:hospitalId', protect, a.getHospitalAppointments);
router.put('/:id/status', protect, a.updateAppointmentStatus);
router.put('/:id/cancel', protect, a.cancelAppointment);

module.exports = router;
