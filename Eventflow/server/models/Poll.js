const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    question: { type: String, required: true },
    options: [{
        text: { type: String, required: true },
        votes: { type: Number, default: 0 }
    }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAnswered: { type: Boolean, default: false },
    answer: { type: String }
}, { timestamps: true });

const Poll = mongoose.model('Poll', pollSchema);
const Question = mongoose.model('Question', questionSchema);

module.exports = { Poll, Question };
