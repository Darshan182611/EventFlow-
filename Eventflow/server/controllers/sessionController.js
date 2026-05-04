const Session = require('../models/Session');
const Engagement = require('../models/Engagement');

exports.createSession = async (req, res) => {
    try {
        const session = await Session.create({ ...req.body });
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventSessions = async (req, res) => {
    try {
        const sessions = await Session.find({ eventId: req.params.eventId }).sort({ order: 1, startTime: 1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateSession = async (req, res) => {
    try {
        const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        await Session.findByIdAndDelete(req.params.id);
        res.json({ message: 'Session deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.reorderSessions = async (req, res) => {
    try {
        const { orderedIds } = req.body;
        for (let i = 0; i < orderedIds.length; i++) {
            await Session.findByIdAndUpdate(orderedIds[i], { order: i });
        }
        res.json({ message: 'Sessions reordered' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.toggleFavorite = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const idx = session.favoritedBy.indexOf(req.user.id);
        if (idx > -1) {
            session.favoritedBy.splice(idx, 1);
        } else {
            session.favoritedBy.push(req.user.id);
            // Award engagement points
            let engagement = await Engagement.findOne({ userId: req.user.id, eventId: session.eventId });
            if (!engagement) {
                engagement = await Engagement.create({ userId: req.user.id, eventId: session.eventId, points: 0, actions: [] });
            }
            engagement.points += 30;
            engagement.actions.push({ type: 'session_attend', points: 30 });
            await engagement.save();
        }
        await session.save();
        res.json({ favorited: idx === -1, totalFavorites: session.favoritedBy.length });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyItinerary = async (req, res) => {
    try {
        const sessions = await Session.find({ favoritedBy: req.user.id })
            .populate('eventId', 'title date location')
            .sort({ startTime: 1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
