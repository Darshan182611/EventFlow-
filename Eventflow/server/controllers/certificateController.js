const Certificate = require('../models/Certificate');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Generate certificates for all checked-in attendees of an event
exports.generateCertificates = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const checkedInTickets = await Ticket.find({ eventId, isCheckedIn: true }).populate('userId', 'name email');
        if (checkedInTickets.length === 0) {
            return res.status(400).json({ message: 'No checked-in attendees found' });
        }

        const certificates = [];
        for (const ticket of checkedInTickets) {
            const existing = await Certificate.findOne({ userId: ticket.userId._id, eventId });
            if (existing) continue;

            const cert = await Certificate.create({
                userId: ticket.userId._id,
                eventId,
                ticketId: ticket._id,
                certificateCode: uuidv4()
            });
            certificates.push(cert);
        }

        res.json({
            message: `${certificates.length} certificates generated`,
            total: certificates.length,
            skipped: checkedInTickets.length - certificates.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get user's certificates
exports.getMyCertificates = async (req, res) => {
    try {
        const certs = await Certificate.find({ userId: req.user.id })
            .populate('eventId', 'title date location category')
            .sort({ issuedAt: -1 });
        res.json(certs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Public verification
exports.verifyCertificate = async (req, res) => {
    try {
        const cert = await Certificate.findOne({ certificateCode: req.params.code })
            .populate('userId', 'name email')
            .populate('eventId', 'title date location');
        if (!cert) return res.status(404).json({ message: 'Certificate not found' });
        res.json({
            valid: true,
            attendee: cert.userId.name,
            event: cert.eventId.title,
            date: cert.eventId.date,
            issuedAt: cert.issuedAt,
            certificateCode: cert.certificateCode
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
