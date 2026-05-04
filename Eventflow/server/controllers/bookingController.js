const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const Ticket = require('../models/Ticket');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');
const { generateTicket } = require('../utils/qrcode');
const { v4: uuidv4 } = require('uuid');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp, ticketTier, ticketTierId, attendeeType, studentRollNumber } = req.body;

        // Verify OTP
        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check tier-specific availability
        let bookingAmount = event.ticketPrice;
        if (ticketTierId && event.ticketTiers.length > 0) {
            const tier = event.ticketTiers.id(ticketTierId);
            if (!tier) return res.status(400).json({ message: 'Invalid ticket tier' });
            if (tier.availableSeats <= 0) return res.status(400).json({ message: `No seats available for ${tier.name} tier` });
            if (tier.requiresStudentId && !studentRollNumber) {
                return res.status(400).json({ message: 'Student roll number is required for Student tier' });
            }
            bookingAmount = tier.price;
        } else {
            if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });
        }

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({ message: 'Already booked or pending' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: bookingAmount === 0 ? 'pending' : 'pending',
            paymentStatus: 'not_paid',
            amount: bookingAmount,
            ticketTier: ticketTier || 'General',
            ticketTierId: ticketTierId || null,
            attendeeType: attendeeType || 'general',
            studentRollNumber: studentRollNumber || null
        });

        await OTP.deleteOne({ _id: validOTP._id });

        res.status(201).json({ message: 'Booking request submitted', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') return res.status(400).json({ message: 'Booking is already confirmed' });

        const event = await Event.findById(booking.eventId._id);

        // Deduct from specific tier if applicable
        if (booking.ticketTierId && event.ticketTiers.length > 0) {
            const tier = event.ticketTiers.id(booking.ticketTierId);
            if (tier && tier.availableSeats > 0) {
                tier.availableSeats -= 1;
            } else {
                return res.status(400).json({ message: 'No seats available in this tier' });
            }
        }

        event.availableSeats -= 1;
        await event.save();

        booking.status = 'confirmed';
        if (paymentStatus) booking.paymentStatus = paymentStatus;
        await booking.save();

        // Generate ticket with QR code
        try {
            const ticketCode = uuidv4();
            const qrData = JSON.stringify({ ticketCode, eventId: event._id, userId: booking.userId._id });
            const qrCodeData = await generateTicket(qrData);
            await Ticket.create({
                bookingId: booking._id,
                userId: booking.userId._id,
                eventId: event._id,
                ticketCode,
                qrCodeData,
                ticketTier: booking.ticketTier
            });
        } catch (qrErr) {
            console.error('QR ticket generation error:', qrErr);
        }

        // Send email
        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin' || req.user.role === 'event_manager'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                // Restore tier seats
                if (booking.ticketTierId && event.ticketTiers.length > 0) {
                    const tier = event.ticketTiers.id(booking.ticketTierId);
                    if (tier) tier.availableSeats += 1;
                }
                await event.save();
            }
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
