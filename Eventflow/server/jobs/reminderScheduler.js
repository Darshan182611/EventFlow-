const cron = require('node-cron');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendOTPEmail } = require('../utils/email');
const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
    }
    return transporter;
}

const sendReminderEmail = async (userEmail, userName, eventTitle, timeLabel) => {
    try {
        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Reminder: ${eventTitle} starts ${timeLabel}!`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;text-align:center;">
                    <h2>⏰ Event Reminder</h2>
                    <p>Hi ${userName},</p>
                    <p>Your event <strong>${eventTitle}</strong> starts <strong>${timeLabel}</strong>!</p>
                    <p>Don't forget to bring your QR ticket for check-in.</p>
                    <p style="color:#999;font-size:12px;">— EventFlow Team</p>
                </div>`
        });
    } catch (err) {
        console.error('Reminder email error:', err.message);
    }
};

const startReminderScheduler = () => {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            const now = new Date();
            const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const in1h = new Date(now.getTime() + 60 * 60 * 1000);

            // 24-hour reminders
            const events24h = await Event.find({ date: { $gte: now, $lte: in24h } });
            for (const event of events24h) {
                const bookings = await Booking.find({
                    eventId: event._id, status: 'confirmed', reminder24hSent: false
                }).populate('userId', 'name email');
                for (const booking of bookings) {
                    await sendReminderEmail(booking.userId.email, booking.userId.name, event.title, 'in 24 hours');
                    booking.reminder24hSent = true;
                    await booking.save();
                }
            }

            // 1-hour reminders
            const events1h = await Event.find({ date: { $gte: now, $lte: in1h } });
            for (const event of events1h) {
                const bookings = await Booking.find({
                    eventId: event._id, status: 'confirmed', reminder1hSent: false
                }).populate('userId', 'name email');
                for (const booking of bookings) {
                    await sendReminderEmail(booking.userId.email, booking.userId.name, event.title, 'in 1 hour');
                    booking.reminder1hSent = true;
                    await booking.save();
                }
            }
        } catch (err) {
            console.error('Reminder scheduler error:', err);
        }
    });
    console.log('📧 Reminder scheduler started (runs every 30 minutes)');
};

module.exports = { startReminderScheduler };
