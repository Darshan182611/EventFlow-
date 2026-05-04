const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Engagement = require('../models/Engagement');

// Check in attendee via QR scan
exports.checkIn = async (req, res) => {
    try {
        const { ticketCode } = req.body;
        const ticket = await Ticket.findOne({ ticketCode })
            .populate('userId', 'name email')
            .populate('eventId', 'title date');

        if (!ticket) return res.status(404).json({ message: 'Invalid ticket' });
        if (ticket.isCheckedIn) {
            return res.status(400).json({
                message: 'Already checked in',
                checkedInAt: ticket.checkedInAt,
                attendee: ticket.userId.name
            });
        }

        ticket.isCheckedIn = true;
        ticket.checkedInAt = new Date();
        ticket.checkedInBy = req.user.id;
        await ticket.save();

        // Award engagement points
        let engagement = await Engagement.findOne({ userId: ticket.userId._id, eventId: ticket.eventId._id });
        if (!engagement) {
            engagement = await Engagement.create({ userId: ticket.userId._id, eventId: ticket.eventId._id, points: 0, actions: [] });
        }
        engagement.points += 50;
        engagement.actions.push({ type: 'check_in', points: 50 });
        await engagement.save();

        res.json({
            message: 'Check-in successful',
            attendee: ticket.userId.name,
            event: ticket.eventId.title,
            tier: ticket.ticketTier,
            checkedInAt: ticket.checkedInAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get all tickets for an event
exports.getEventTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ eventId: req.params.eventId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get attendance stats for an event
exports.getAttendanceStats = async (req, res) => {
    try {
        const total = await Ticket.countDocuments({ eventId: req.params.eventId });
        const checkedIn = await Ticket.countDocuments({ eventId: req.params.eventId, isCheckedIn: true });
        res.json({
            total,
            checkedIn,
            notCheckedIn: total - checkedIn,
            attendanceRate: total > 0 ? ((checkedIn / total) * 100).toFixed(1) : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get user's tickets
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.user.id })
            .populate('eventId', 'title date location category image')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Verify ticket details without checking in
exports.verifyTicket = async (req, res) => {
    try {
        const { ticketCode } = req.params;
        const ticket = await Ticket.findOne({ ticketCode })
            .populate('userId', 'name email')
            .populate('eventId', 'title date');

        if (!ticket) return res.status(404).json({ message: 'Invalid ticket' });
        
        res.json({
            ticketCode: ticket.ticketCode,
            attendee: ticket.userId.name,
            event: ticket.eventId.title,
            tier: ticket.ticketTier,
            isCheckedIn: ticket.isCheckedIn,
            checkedInAt: ticket.checkedInAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

