const express = require('express');
const router = express.Router();
const { getLeaderboard, getMyEngagement } = require('../controllers/engagementController');
const { getSuggestions } = require('../controllers/networkingController');
const { getOverview, getRevenueOverTime, getRegistrationTrends, getPredictions } = require('../controllers/analyticsController');
const { getUsers, updateUserRole, updateProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Engagement & Gamification
router.get('/engagement/leaderboard/:eventId', protect, getLeaderboard);
router.get('/engagement/my/:eventId', protect, getMyEngagement);

// AI Networking
router.get('/networking/suggestions/:eventId', protect, getSuggestions);

// Analytics (admin/accountant)
router.get('/analytics/overview', protect, authorize('admin', 'accountant'), getOverview);
router.get('/analytics/revenue', protect, authorize('admin', 'accountant'), getRevenueOverTime);
router.get('/analytics/registrations', protect, authorize('admin', 'accountant'), getRegistrationTrends);
router.get('/analytics/predictions', protect, authorize('admin', 'event_manager'), getPredictions);

// User Management (admin)
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/profile', protect, updateProfile);

module.exports = router;
