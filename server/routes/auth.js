import express from 'express';
import User from '../models/User.js';
import InviteCode from '../models/InviteCode.js';
import { protect, generateToken } from '../middleware/auth.js';
import { validateEmail } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user with invite code
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password, displayName, inviteCode } = req.body;

        // Validate required fields
        if (!email || !password || !displayName || !inviteCode) {
            return res.status(400).json({
                message: 'Please provide email, password, display name, and invite code'
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Validate invite code
        const invite = await InviteCode.findOne({ code: inviteCode.toUpperCase() });
        if (!invite) {
            return res.status(400).json({ message: 'Invalid invite code' });
        }

        if (invite.isUsed) {
            return res.status(400).json({ message: 'Invite code has already been used' });
        }

        if (invite.expiresAt && new Date() > invite.expiresAt) {
            return res.status(400).json({ message: 'Invite code has expired' });
        }

        /* if (!invite.isValid()) {
            return res.status(400).json({ message: 'Invite code has expired' });
        } */

        // Create user
        const user = await User.create({
            email,
            password,
            displayName,
            invitedBy: invite.createdBy,
            isTemporary: invite.userType === 'temporary',
            temporaryValidityDuration: invite.userValidityDuration,
            // If temporary, expiresAt is calculated on first login, so default is null
            temporaryExpiresAt: null,
            firstLoginAt: null
        });

        // Mark invite as used
        await invite.markAsUsed(user._id);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password || typeof email !== 'string') {
            return res.status(400).json({ message: 'Please provide valid email and password' });
        }

        // Find user
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if disabled
        if (user.isDisabled) {
            return res.status(403).json({ message: 'Your account has been disabled by an administrator.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Handle Temporary User Expiry Logic
        if (user.isTemporary) {
            // First time login
            if (!user.firstLoginAt) {
                user.firstLoginAt = new Date();
                user.temporaryExpiresAt = new Date(Date.now() + (user.temporaryValidityDuration || 24 * 60 * 60 * 1000));
                await user.save();
            }
            // Check expiry
            else if (user.temporaryExpiresAt && Date.now() > user.temporaryExpiresAt) {
                await user.deleteOne();
                return res.status(401).json({ message: 'Your temporary access has expired.' });
            }
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    // This route requires the protect middleware to be applied
    // It's added in index.js
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { displayName, avatar } = req.body;

        const user = await User.findById(req.user._id);

        if (displayName) user.displayName = displayName;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            _id: user._id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            role: user.role
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/verify-password
// @desc    Verify current user's password
// @access  Private
router.post('/verify-password', protect, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        res.json({ message: 'Verified' });
    } catch (error) {
        console.error('Verify password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
