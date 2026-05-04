const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, setupMFA, verifyMFA, disableMFA } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/mfa/setup', protect, setupMFA);
router.post('/mfa/verify', protect, verifyMFA);
router.post('/mfa/disable', protect, disableMFA);

module.exports = router;
