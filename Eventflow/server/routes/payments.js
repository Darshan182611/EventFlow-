const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/', protect, authorize('admin', 'accountant'), getPayments);

module.exports = router;
