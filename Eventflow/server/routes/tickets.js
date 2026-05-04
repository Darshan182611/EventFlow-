const express = require('express');
const router = express.Router();
const { checkIn, getEventTickets, getAttendanceStats, getMyTickets, verifyTicket } = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

router.post('/check-in', protect, authorize('admin', 'event_manager', 'volunteer'), checkIn);
router.get('/verify/:ticketCode', protect, authorize('admin', 'event_manager', 'volunteer'), verifyTicket);
router.get('/event/:eventId', protect, authorize('admin', 'event_manager'), getEventTickets);
router.get('/stats/:eventId', protect, authorize('admin', 'event_manager'), getAttendanceStats);
router.get('/my', protect, getMyTickets);

module.exports = router;
