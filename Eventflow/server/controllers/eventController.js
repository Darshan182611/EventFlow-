const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
    try {
        const filters = {};
        if (req.query.category) filters.category = req.query.category;
        if (req.query.search) filters.title = { $regex: req.query.search, $options: 'i' };

        const events = await Event.find(filters).populate('createdBy', 'name email');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, image, ticketTiers } = req.body;

        let finalTiers = [];
        let computedTotalSeats = totalSeats || 0;

        if (ticketTiers && ticketTiers.length > 0) {
            finalTiers = ticketTiers.map(t => ({
                name: t.name,
                price: Number(t.price) || 0,
                totalSeats: Number(t.totalSeats),
                availableSeats: Number(t.totalSeats),
                description: t.description || '',
                requiresStudentId: t.name === 'Student'
            }));
            computedTotalSeats = finalTiers.reduce((sum, t) => sum + t.totalSeats, 0);
        }

        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            totalSeats: computedTotalSeats,
            availableSeats: computedTotalSeats,
            ticketPrice: ticketPrice || (finalTiers.length > 0 ? Math.min(...finalTiers.map(t => t.price)) : 0),
            ticketTiers: finalTiers,
            image: image || '',
            createdBy: req.user.id
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Update floor plan
exports.updateFloorPlan = async (req, res) => {
    try {
        const { imageUrl, markers } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { floorPlan: { imageUrl, markers } },
            { new: true }
        );
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
