const express = require('express');
const router = express.Router();
const { createPoll, getEventPolls, votePoll, closePoll, askQuestion, getEventQuestions, upvoteQuestion, answerQuestion } = require('../controllers/pollController');
const { protect, authorize } = require('../middleware/auth');

router.post('/polls', protect, authorize('admin', 'event_manager'), createPoll);
router.get('/polls/event/:eventId', protect, getEventPolls);
router.post('/polls/:id/vote', protect, votePoll);
router.put('/polls/:id/close', protect, authorize('admin', 'event_manager'), closePoll);
router.post('/questions', protect, askQuestion);
router.get('/questions/event/:eventId', protect, getEventQuestions);
router.post('/questions/:id/upvote', protect, upvoteQuestion);
router.put('/questions/:id/answer', protect, authorize('admin', 'event_manager'), answerQuestion);

module.exports = router;
