const User = require('../models/User');
const Booking = require('../models/Booking');

exports.getSuggestions = async (req, res) => {
    try {
        const { eventId } = req.params;
        const currentUser = await User.findById(req.user.id);
        const bookings = await Booking.find({ eventId, status: 'confirmed', userId: { $ne: req.user.id } })
            .populate('userId', 'name email userType organization interests bio jobTitle');
        const attendees = bookings.map(b => b.userId).filter(Boolean);

        const suggestions = attendees.map(attendee => {
            let score = 0;
            if (currentUser.interests?.length && attendee.interests?.length) {
                const intersection = currentUser.interests.filter(i => attendee.interests.includes(i));
                const union = new Set([...currentUser.interests, ...attendee.interests]);
                score += (intersection.length / union.size) * 50;
            }
            if (currentUser.userType === attendee.userType) score += 15;
            if (currentUser.organization && attendee.organization && currentUser.organization === attendee.organization) score += 20;
            if (currentUser.bio && attendee.bio) score += 10;
            return { _id: attendee._id, name: attendee.name, userType: attendee.userType, organization: attendee.organization, interests: attendee.interests, bio: attendee.bio, matchScore: Math.round(score) };
        });

        suggestions.sort((a, b) => b.matchScore - a.matchScore);
        res.json(suggestions.slice(0, 10));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
