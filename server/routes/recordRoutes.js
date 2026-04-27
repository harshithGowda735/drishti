const express = require('express');
const router = express.Router();
const r = require('../controllers/recordController');
const { protect } = require('../middleware/auth');

router.get('/patient/:patientId', protect, r.getPatientRecords);
router.get('/:id', protect, r.getRecord);
router.post('/', protect, r.createRecord);
router.post('/analyze', protect, r.analyzeReport);

module.exports = router;
