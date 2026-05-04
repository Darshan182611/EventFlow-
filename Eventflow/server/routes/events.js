const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent, updateFloorPlan } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, authorize('admin', 'event_manager'), createEvent);
router.put('/:id', protect, authorize('admin', 'event_manager'), updateEvent);
router.delete('/:id', protect, authorize('admin', 'event_manager'), deleteEvent);
router.put('/:id/floor-plan', protect, authorize('admin', 'event_manager'), updateFloorPlan);

module.exports = router;
