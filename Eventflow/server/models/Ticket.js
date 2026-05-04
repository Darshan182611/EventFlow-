const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketCode: { type: String, required: true, unique: true },
    qrCodeData: { type: String }, // base64 encoded QR image
    ticketTier: { type: String, default: 'General' },
    isCheckedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
