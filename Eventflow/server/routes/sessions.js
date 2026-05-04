const express = require('express');
const router = express.Router();
const { createSession, getEventSessions, updateSession, deleteSession, reorderSessions, toggleFavorite, getMyItinerary } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin', 'event_manager'), createSession);
router.get('/event/:eventId', getEventSessions);
router.put('/reorder', protect, authorize('admin', 'event_manager'), reorderSessions);
router.put('/:id', protect, authorize('admin', 'event_manager'), updateSession);
router.delete('/:id', protect, authorize('admin', 'event_manager'), deleteSession);
router.post('/:id/favorite', protect, toggleFavorite);
router.get('/my-itinerary', protect, getMyItinerary);

module.exports = router;
