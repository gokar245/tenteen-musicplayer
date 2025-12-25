import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Check temporary user expiry
            if (req.user.isTemporary) {
                if (!req.user.temporaryExpiresAt) {
                    // First use: Start the timer
                    const duration = req.user.temporaryValidityDuration || 24 * 60 * 60 * 1000;
                    const expiresAt = new Date(Date.now() + duration);

                    await User.updateOne({ _id: req.user._id }, {
                        firstLoginAt: new Date(),
                        temporaryExpiresAt: expiresAt
                    });

                    req.user.temporaryExpiresAt = expiresAt; // Update local instance
                } else if (new Date() > req.user.temporaryExpiresAt) {
                    // Expired: Delete
                    await req.user.deleteOne();
                    return res.status(401).json({ message: 'Temporary access expired' });
                }
            }

            next();
            return; // Added return to prevent execution of next block
        } catch (error) {
            console.error('Auth error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // Check for token in query params (for audio streaming)
    if (req.query.token) {
        try {
            token = req.query.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Check temporary user expiry
            if (req.user.isTemporary) {
                if (!req.user.temporaryExpiresAt) {
                    // First use: Start the timer
                    const duration = req.user.temporaryValidityDuration || 24 * 60 * 60 * 1000;
                    const expiresAt = new Date(Date.now() + duration);

                    await User.updateOne({ _id: req.user._id }, {
                        firstLoginAt: new Date(),
                        temporaryExpiresAt: expiresAt
                    });

                    req.user.temporaryExpiresAt = expiresAt; // Update local instance
                } else if (new Date() > req.user.temporaryExpiresAt) {
                    // Expired: Delete
                    await req.user.deleteOne();
                    return res.status(401).json({ message: 'Temporary access expired' });
                }
            }

            next();
            return;
        } catch (error) {
            console.error('Auth error (query):', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// Generate JWT token
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

export default { protect, adminOnly, generateToken };
