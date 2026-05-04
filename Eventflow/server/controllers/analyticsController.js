const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Payment = require('../models/Payment');
const User = require('../models/User');

exports.getOverview = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const totalUsers = await User.countDocuments();
        const totalRevenue = await Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const totalCheckedIn = await Ticket.countDocuments({ isCheckedIn: true });
        const totalTickets = await Ticket.countDocuments();

        res.json({
            totalEvents, totalBookings, confirmedBookings, pendingBookings, totalUsers,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalCheckedIn, totalTickets,
            attendanceRate: totalTickets > 0 ? ((totalCheckedIn / totalTickets) * 100).toFixed(1) : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getRevenueOverTime = async (req, res) => {
    try {
        const revenue = await Payment.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }, { $limit: 30 }
        ]);
        res.json(revenue.map(r => ({ date: r._id, revenue: r.total, transactions: r.count })));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getRegistrationTrends = async (req, res) => {
    try {
        const trends = await Booking.aggregate([
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }, { $limit: 30 }
        ]);
        res.json(trends.map(t => ({ date: t._id, registrations: t.count })));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getPredictions = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 }).limit(10);
        const predictions = [];
        for (const event of events) {
            const totalTickets = await Ticket.countDocuments({ eventId: event._id });
            const checkedIn = await Ticket.countDocuments({ eventId: event._id, isCheckedIn: true });
            const confirmed = await Booking.countDocuments({ eventId: event._id, status: 'confirmed' });
            const noShowRate = confirmed > 0 ? (((confirmed - checkedIn) / confirmed) * 100).toFixed(1) : 0;
            const bookingVelocity = await Booking.countDocuments({
                eventId: event._id,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });
            const seatsRemaining = event.availableSeats;
            const selloutETA = bookingVelocity > 0 ? Math.ceil(seatsRemaining / (bookingVelocity / 7)) : null;

            predictions.push({
                eventId: event._id, title: event.title, date: event.date,
                noShowRate: Number(noShowRate), confirmed, checkedIn,
                bookingVelocity, selloutETA,
                demandLevel: bookingVelocity > 10 ? 'High' : bookingVelocity > 3 ? 'Medium' : 'Low'
            });
        }
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
