const express = require('express');
const router = express.Router();
const { generateCertificates, getMyCertificates, verifyCertificate } = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

router.post('/generate/:eventId', protect, authorize('admin', 'event_manager'), generateCertificates);
router.get('/my', protect, getMyCertificates);
router.get('/verify/:code', verifyCertificate);

module.exports = router;
