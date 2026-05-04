const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    certificateCode: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
