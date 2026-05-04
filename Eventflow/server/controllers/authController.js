const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
    try {
        const { name, email, password, userType, phone, studentRollNumber, organization, jobTitle, interests } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            if (!user.password) {
                await User.deleteOne({ _id: user._id });
            } else {
                return res.status(400).json({ message: 'User already exists' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name, email, password: hashedPassword,
            role: 'user', isVerified: false,
            userType: userType || 'general',
            phone: phone || '', studentRollNumber: studentRollNumber || '',
            organization: organization || '', jobTitle: jobTitle || '',
            interests: interests || []
        });

        const otp = generateOTP();
        await OTP.create({ email, otp, action: 'account_verification' });
        await sendOTPEmail(email, otp, 'account_verification');

        res.status(201).json({ message: 'OTP sent to email. Please verify.', email: user.email });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.password) {
            await User.deleteOne({ _id: user._id });
            return res.status(400).json({ message: 'Account data was corrupted. Please register again.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();
            await OTP.findOneAndDelete({ email: user.email, action: 'account_verification' });
            await OTP.create({ email: user.email, otp, action: 'account_verification' });
            await sendOTPEmail(user.email, otp, 'account_verification');
            return res.status(403).json({ message: 'Account not verified', needsVerification: true, email: user.email });
        }

        res.json({
            _id: user.id, name: user.name, email: user.email,
            role: user.role, userType: user.userType,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const validOTP = await OTP.findOne({ email, otp, action: 'account_verification' });
        if (!validOTP) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        await OTP.deleteOne({ _id: validOTP._id });

        res.json({
            _id: user.id, name: user.name, email: user.email,
            role: user.role, userType: user.userType,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// MFA Setup
exports.setupMFA = async (req, res) => {
    try {
        const speakeasy = require('speakeasy');
        const QRCode = require('qrcode');
        const secret = speakeasy.generateSecret({ name: `EventFlow:${req.user.email}` });
        await User.findByIdAndUpdate(req.user.id, { mfaSecret: secret.base32 });
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        res.json({ secret: secret.base32, qrCode: qrCodeUrl });
    } catch (error) {
        res.status(500).json({ message: 'MFA setup failed', error: error.message });
    }
};

exports.verifyMFA = async (req, res) => {
    try {
        const speakeasy = require('speakeasy');
        const user = await User.findById(req.user.id);
        const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token: req.body.token, window: 1 });
        if (!verified) return res.status(400).json({ message: 'Invalid MFA token' });
        await User.findByIdAndUpdate(req.user.id, { mfaEnabled: true });
        res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'MFA verification failed', error: error.message });
    }
};

exports.disableMFA = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { mfaEnabled: false, mfaSecret: null });
        res.json({ message: 'MFA disabled' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
