const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'volunteer', 'accountant', 'event_manager'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    // Extended profile
    userType: { type: String, enum: ['general', 'student', 'professional', 'organizer'], default: 'general' },
    phone: { type: String },
    studentRollNumber: { type: String },
    organization: { type: String },
    jobTitle: { type: String },
    bio: { type: String },
    interests: [{ type: String }],
    // MFA
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
