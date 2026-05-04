const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const ticketRoutes = require('./routes/tickets');
const paymentRoutes = require('./routes/payments');
const sessionRoutes = require('./routes/sessions');
const certificateRoutes = require('./routes/certificates');
const pollRoutes = require('./routes/polls');
const advancedRoutes = require('./routes/advanced');

const app = express();

// Security middleware
try {
    const helmet = require('helmet');
    app.use(helmet());
} catch (e) { /* helmet not installed yet */ }

try {
    const rateLimit = require('express-rate-limit');
    app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));
} catch (e) { /* rate-limit not installed yet */ }

try {
    const mongoSanitize = require('express-mongo-sanitize');
    app.use(mongoSanitize());
} catch (e) { /* mongo-sanitize not installed yet */ }

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/engage', pollRoutes);
app.use('/api', advancedRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventflow')
  .then(() => {
      console.log('MongoDB Connected');
      // Start reminder scheduler
      try {
          const { startReminderScheduler } = require('./jobs/reminderScheduler');
          startReminderScheduler();
      } catch (e) {
          console.log('Reminder scheduler skipped (install node-cron)');
      }
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
