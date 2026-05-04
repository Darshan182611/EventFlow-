const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');

dotenv.config();

const users = [
    { name: 'Admin User', email: 'darshanjha18677@gmail.com', password: 'password123', role: 'admin' },
    { name: 'Demo User', email: 'darshanjha18677+user@gmail.com', password: 'password123', role: 'user' },
    { name: 'Alice Smith', email: 'alice@eventflow.com', password: 'password123', role: 'user' },
    { name: 'Bob Johnson', email: 'bob@eventflow.com', password: 'password123', role: 'user' },
    { name: 'Charlie Dave', email: 'charlie@eventflow.com', password: 'password123', role: 'user' },
    { name: 'Diana Prince', email: 'diana@eventflow.com', password: 'password123', role: 'user' },
    { name: 'Ethan Hunt', email: 'ethan@eventflow.com', password: 'password123', role: 'user' },
    { name: 'Fiona Gallagher', email: 'fiona@eventflow.com', password: 'password123', role: 'user' },
    { name: 'George Miller', email: 'george@eventflow.com', password: 'password123', role: 'user' },
    { name: 'Hannah Montana', email: 'hannah@eventflow.com', password: 'password123', role: 'user' }
];

const events = [
    {
        title: 'React & Node.js Developer Retreat',
        description: 'Join us for a 3-day deep dive into modern full-stack web development. Perfect for developers looking to take their skills to the next level.',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        location: 'Silicon Valley Innovation Center, CA',
        category: 'Technology',
        totalSeats: 200,
        ticketPrice: 0,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
        ticketTiers: [
            { name: 'Free', price: 0, totalSeats: 150, availableSeats: 150 },
            { name: 'VIP', price: 500, totalSeats: 50, availableSeats: 50 }
        ]
    },
    {
        title: 'Neon Nights EDM Festival',
        description: 'Experience an unforgettable night of EDM, techno, and dazzling light shows with top DJs from around the globe.',
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        location: 'Grand Arena, New York',
        category: 'Music',
        totalSeats: 500,
        ticketPrice: 1500,
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
        ticketTiers: [
            { name: 'Early Bird', price: 1200, totalSeats: 200, availableSeats: 200 },
            { name: 'General', price: 1500, totalSeats: 200, availableSeats: 200 },
            { name: 'VIP', price: 3000, totalSeats: 100, availableSeats: 100 }
        ]
    },
    {
        title: 'Global Leaders Business Summit',
        description: 'A premium gathering of CEOs, founders, and investors discussing the future of global commerce and AI integration.',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        location: 'The Ritz-Carlton, London',
        category: 'Business',
        totalSeats: 150,
        ticketPrice: 5000,
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Modern Art Expo 2024',
        description: 'Discover breathtaking contemporary and modern arts from underground and trending artists this season.',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        location: 'Downtown Art Museum',
        category: 'Art',
        totalSeats: 300,
        ticketPrice: 200,
        image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Photography Workshop: Golden Hour',
        description: 'Learn the secrets of capturing the perfect sunset shots with professional landscape photographers.',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Santa Monica Beach, CA',
        category: 'Workshop',
        totalSeats: 50,
        ticketPrice: 450,
        image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'International City Marathon',
        description: 'Join thousands of runners in the city\'s biggest athletic event of the year. All fitness levels welcome!',
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        location: 'City Square, Chicago',
        category: 'Sports',
        totalSeats: 1000,
        ticketPrice: 500,
        image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&q=80&w=800',
        ticketTiers: [
            { name: 'Student', price: 300, totalSeats: 300, availableSeats: 300, requiresStudentId: true },
            { name: 'General', price: 500, totalSeats: 600, availableSeats: 600 },
            { name: 'VIP', price: 1000, totalSeats: 100, availableSeats: 100 }
        ]
    },
    {
        title: 'Quantum Physics Symposium',
        description: 'A deep exploration into quantum entanglement, computing, and the mysteries of the multiverse.',
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        location: 'Science Institute, Geneva',
        category: 'Science',
        totalSeats: 250,
        ticketPrice: 1200,
        image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Interior Design Showcase',
        description: 'The year\'s most anticipated exhibition of sustainable and minimalist interior design trends.',
        date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        location: 'Design Center, Milan',
        category: 'Design',
        totalSeats: 400,
        ticketPrice: 350,
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Culinary Masterclass: Italian Classics',
        description: 'Master the art of handmade pasta and traditional sauces with Michelin-starred chefs.',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: 'The Cooking Lab, Florence',
        category: 'Workshop',
        totalSeats: 20,
        ticketPrice: 2500,
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'AI & Future of Work Meetup',
        description: 'Networking and lightning talks about how LLMs and agents are reshaping the professional landscape.',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        location: 'Innovation Cafe, Austin',
        category: 'Meetup',
        totalSeats: 150,
        ticketPrice: 0,
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventflow');
        console.log('\n✅ MongoDB connection open...');

        await User.deleteMany();
        await Event.deleteMany();
        await Booking.deleteMany();
        console.log('🗑️  Cleared existing data.');

        // Hash user passwords
        const salt = await bcrypt.genSalt(10);
        const hashedUsers = users.map(u => ({
            ...u,
            password: bcrypt.hashSync(u.password, salt),
            isVerified: true
        }));

        const createdUsers = await User.insertMany(hashedUsers);
        const adminUser = createdUsers.find(u => u.role === 'admin');
        const normalUsers = createdUsers.filter(u => u.role === 'user');
        console.log(`👤 Created ${createdUsers.length} total dummy users.`);

        // Link events to admin
        const eventsWithAdmin = events.map(e => ({
            ...e,
            availableSeats: e.totalSeats,
            createdBy: adminUser._id
        }));

        const createdEvents = await Event.insertMany(eventsWithAdmin);
        console.log(`🎉 Created ${createdEvents.length} distinct events with aesthetic images.`);

        // Generate Bookings Data
        const bookingsData = [];

        for (const event of createdEvents) {
            const randomCount = Math.floor(Math.random() * 4) + 3;
            const shuffledUsers = [...normalUsers].sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, randomCount);

            for (const user of selectedUsers) {
                const statuses = ['pending', 'confirmed', 'cancelled'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                let paymentStatus = 'not_paid';
                if (status === 'confirmed' && event.ticketPrice > 0) {
                    paymentStatus = Math.random() > 0.1 ? 'paid' : 'not_paid';
                } else if (event.ticketPrice === 0) {
                    paymentStatus = 'paid';
                }

                bookingsData.push({
                    userId: user._id,
                    eventId: event._id,
                    status: status,
                    paymentStatus: paymentStatus,
                    amount: event.ticketPrice
                });

                if (status === 'confirmed') {
                    event.availableSeats -= 1;
                    await event.save();
                }
            }
        }

        await Booking.insertMany(bookingsData);
        console.log(`🎫 Inserted ${bookingsData.length} randomized dummy bookings.`);

        console.log('\n🚀 Database seeded successfully with 10 diverse events!');
        console.log('-------------------------------------------');
        console.log('Admin Email: darshanjha18677@gmail.com');
        console.log('User Email:  darshanjha18677+user@gmail.com');
        console.log('Password for all users: password123');
        console.log('-------------------------------------------\n');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedDatabase();
