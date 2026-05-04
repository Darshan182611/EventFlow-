const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending' },
    paymentStatus: { type: String, enum: ['paid', 'not_paid', 'refunded'], default: 'not_paid' },
    amount: { type: Number, required: true },
    // Multi-tier fields
    ticketTier: { type: String, default: 'General' },
    ticketTierId: { type: mongoose.Schema.Types.ObjectId },
    attendeeType: { type: String, enum: ['general', 'student', 'vip', 'early_bird'], default: 'general' },
    studentRollNumber: { type: String },
    // Reminder tracking
    reminder24hSent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
    bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
