const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { sendBookingEmail } = require('../utils/email');
const { generateTicket } = require('../utils/qrcode');
const { v4: uuidv4 } = require('uuid');

let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} catch (err) {
    console.warn('Razorpay not configured. Payment features disabled.');
}

// Create Razorpay order
exports.createOrder = async (req, res) => {
    try {
        if (!razorpay) return res.status(503).json({ message: 'Payment gateway not configured' });

        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.amount === 0) return res.status(400).json({ message: 'This is a free event' });

        const options = {
            amount: booking.amount * 100, // Razorpay uses paise
            currency: 'INR',
            receipt: `receipt_${bookingId}`,
            notes: { bookingId: bookingId.toString(), eventTitle: booking.eventId.title }
        };

        const order = await razorpay.orders.create(options);

        const payment = await Payment.create({
            bookingId,
            userId: req.user.id,
            eventId: booking.eventId._id,
            razorpayOrderId: order.id,
            amount: booking.amount,
            status: 'created'
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            paymentId: payment._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex');

        if (expectedSign !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Update payment
        await Payment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'paid',
                invoiceNumber: `INV-${Date.now()}`
            }
        );

        // Update booking
        const booking = await Booking.findById(bookingId).populate('userId').populate('eventId');
        booking.status = 'confirmed';
        booking.paymentStatus = 'paid';
        await booking.save();

        // Deduct seats
        const event = await Event.findById(booking.eventId._id);
        if (booking.ticketTierId && event.ticketTiers.length > 0) {
            const tier = event.ticketTiers.id(booking.ticketTierId);
            if (tier) tier.availableSeats -= 1;
        }
        event.availableSeats -= 1;
        await event.save();

        // Generate QR ticket
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
        } catch (err) {
            console.error('QR generation error:', err);
        }

        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

        res.json({ message: 'Payment verified and booking confirmed', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get payment history
exports.getPayments = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' || req.user.role === 'accountant' ? {} : { userId: req.user.id };
        const payments = await Payment.find(filter)
            .populate('bookingId')
            .populate('eventId', 'title')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
