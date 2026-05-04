const Engagement = require('../models/Engagement');

exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Engagement.find({ eventId: req.params.eventId })
            .populate('userId', 'name email userType')
            .sort({ points: -1 }).limit(20);
        res.json(leaderboard.map((e, i) => ({
            rank: i + 1, userId: e.userId._id, name: e.userId.name,
            userType: e.userId.userType, points: e.points, actions: e.actions.length
        })));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyEngagement = async (req, res) => {
    try {
        const engagement = await Engagement.findOne({ userId: req.user.id, eventId: req.params.eventId });
        res.json(engagement || { points: 0, actions: [] });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
