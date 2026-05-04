const User = require('../models/User');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -mfaSecret').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['user', 'admin', 'volunteer', 'accountant', 'event_manager'];
        if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -mfaSecret');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { phone, organization, jobTitle, bio, interests, userType, studentRollNumber } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id,
            { phone, organization, jobTitle, bio, interests, userType, studentRollNumber },
            { new: true }
        ).select('-password -mfaSecret');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
