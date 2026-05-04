const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    speaker: { type: String },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    room: { type: String },
    track: { type: String },
    capacity: { type: Number },
    order: { type: Number, default: 0 },
    favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
