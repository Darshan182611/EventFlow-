const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    points: { type: Number, default: 0 },
    actions: [{
        type: { type: String, enum: ['check_in', 'session_attend', 'poll_vote', 'question_ask', 'question_upvote', 'networking'] },
        points: { type: Number },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Engagement', engagementSchema);
