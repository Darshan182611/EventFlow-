const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
    name: { type: String, enum: ['Free', 'General', 'VIP', 'Early Bird', 'Student'], required: true },
    price: { type: Number, required: true, default: 0 },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    description: { type: String, default: '' },
    requiresStudentId: { type: Boolean, default: false }
}, { _id: true });

const floorPlanMarkerSchema = new mongoose.Schema({
    type: { type: String, enum: ['booth', 'stage', 'restroom', 'exit', 'food', 'info'] },
    label: { type: String },
    x: { type: Number },
    y: { type: Number }
}, { _id: true });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    // Legacy single-tier fields (kept for backward compatibility)
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    ticketPrice: { type: Number, required: true, default: 0 },
    // Multi-tier ticketing
    ticketTiers: [ticketTierSchema],
    image: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Floor plan
    floorPlan: {
        imageUrl: { type: String },
        markers: [floorPlanMarkerSchema]
    }
}, { timestamps: true });

// Virtual: compute total available seats across all tiers
eventSchema.virtual('computedAvailableSeats').get(function () {
    if (this.ticketTiers && this.ticketTiers.length > 0) {
        return this.ticketTiers.reduce((sum, t) => sum + t.availableSeats, 0);
    }
    return this.availableSeats;
});

// Virtual: min ticket price
eventSchema.virtual('minPrice').get(function () {
    if (this.ticketTiers && this.ticketTiers.length > 0) {
        return Math.min(...this.ticketTiers.map(t => t.price));
    }
    return this.ticketPrice;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
