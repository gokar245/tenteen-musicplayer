import express from 'express';
import InviteCode from '../models/InviteCode.js';
import User from '../models/User.js';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import Artist from '../models/Artist.js';
import Playlist from '../models/Playlist.js';
import AdminSettings from '../models/AdminSettings.js';
import { protect, adminOnly } from '../middleware/auth.js';
import storage from '../services/storage.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// ========================================
// INVITE CODES
// ========================================

// @route   POST /api/admin/invite
// @desc    Generate new invite code
// @access  Admin
router.post('/invite', async (req, res) => {
    try {
        const { userType = 'permanent', duration } = req.body;

        let userValidityDuration = null;
        if (userType === 'temporary') {
            switch (duration) {
                case '1d':
                    userValidityDuration = 24 * 60 * 60 * 1000;
                    break;
                case '1w':
                    userValidityDuration = 7 * 24 * 60 * 60 * 1000;
                    break;
                case '1m':
                    userValidityDuration = 30 * 24 * 60 * 60 * 1000;
                    break;
                case '3m':
                    userValidityDuration = 90 * 24 * 60 * 60 * 1000;
                    break;
                case '1min':
                    userValidityDuration = 60 * 1000; // 1 Minute
                    break;
                default:
                    // Default to 1 day if not specified
                    userValidityDuration = 24 * 60 * 60 * 1000;
            }
        }

        const invite = await InviteCode.create({
            createdBy: req.user._id,
            userType,
            userValidityDuration,
            // Code itself expires in 7 days by default (or we can make this configurable too, but user didn't ask)
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.status(201).json({
            code: invite.code,
            expiresAt: invite.expiresAt,
            createdAt: invite.createdAt,
            userType: invite.userType,
            userValidityDuration: invite.userValidityDuration
        });
    } catch (error) {
        console.error('Generate invite error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/invites
// @desc    Get all invite codes created by admin
// @access  Admin
router.get('/invites', async (req, res) => {
    try {
        const invites = await InviteCode.find({ createdBy: req.user._id })
            .populate('usedBy', 'displayName email')
            .sort({ createdAt: -1 });

        res.json(invites);
    } catch (error) {
        console.error('Get invites error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/invite/:code
// @desc    Delete an unused invite code
// @access  Admin
router.delete('/invite/:code', async (req, res) => {
    try {
        const invite = await InviteCode.findOne({
            code: req.params.code.toUpperCase(),
            createdBy: req.user._id
        });

        if (!invite) {
            return res.status(404).json({ message: 'Invite code not found' });
        }

        if (invite.isUsed) {
            return res.status(400).json({ message: 'Cannot delete a used invite code' });
        }

        await invite.deleteOne();
        res.json({ message: 'Invite code deleted' });
    } catch (error) {
        console.error('Delete invite error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========================================
// USERS
// ========================================

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            // .select('-password') // User requested to see password hash
            .populate('invitedBy', 'displayName email')
            .sort({ createdAt: -1 });

        // Get pending upload counts for each user
        const usersWithCounts = await Promise.all(users.map(async (user) => {
            const pendingCount = await Song.countDocuments({
                uploadedBy: user._id,
                status: 'pending'
            });
            const totalUploads = await Song.countDocuments({
                uploadedBy: user._id
            });
            return {
                ...user.toJSON(),
                pendingUploads: pendingCount,
                totalUploads
            };
        }));

        res.json(usersWithCounts);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting self (optional but good practice)
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/user/:id/media
// @desc    Get user's uploads
// @access  Admin
router.get('/user/:id/media', async (req, res) => {
    try {
        const songs = await Song.find({ uploadedBy: req.params.id })
            .populate('artist', 'name')
            .populate('album', 'title')
            .sort({ createdAt: -1 });

        res.json(songs);
    } catch (error) {
        console.error('Get user media error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({ message: 'User role updated', user: user.toJSON() });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/users/:id/disable
// @desc    Toggle user disabled state
// @access  Admin
router.patch('/users/:id/toggle-status', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isDisabled = !user.isDisabled;
        await user.save();

        res.json({
            message: user.isDisabled ? 'User disabled' : 'User enabled',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========================================
// PENDING UPLOADS
// ========================================

// @route   GET /api/admin/pending
// @desc    Get all pending media
// @access  Admin
router.get('/pending', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const songs = await Song.find({ status: 'pending' })
            .populate('artist', 'name image')
            .populate('album', 'title coverImage')
            .populate('uploadedBy', 'displayName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Song.countDocuments({ status: 'pending' });

        res.json({
            songs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get pending error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/media/:id
// @desc    Get media details for admin review
// @access  Admin
router.get('/media/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artist', 'name image')
            .populate('album', 'title coverImage')
            .populate('uploadedBy', 'displayName email');

        if (!song) {
            return res.status(404).json({ message: 'Media not found' });
        }

        res.json(song);
    } catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/approve/:id
// @desc    Approve pending media
// @access  Admin
router.post('/approve/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Media not found' });
        }

        song.status = 'approved';
        await song.save();

        res.json({ message: 'Media approved', song });
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/reject/:id
// @desc    Reject and delete media (including Cloudinary resource)
// @access  Admin
// @route   DELETE /api/admin/reject/:id
// @desc    Reject and delete media (including Cloudinary resource)
// @access  Admin
router.delete('/reject/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Delete from storage
        try {
            if (song.storageType === 'cloudinary' && song.cloudinary?.public_id) {
                await storage.deleteAudio(song.cloudinary.public_id);
            } else if (song.fileUrl) {
                const filename = song.fileUrl.split('/').pop();
                await storage.deleteAudio(filename);
            }
        } catch (err) {
            console.error('Error deleting audio file:', err);
        }

        // Delete cover image if exists
        try {
            if (song.coverImageCloudinary?.public_id) {
                await storage.deleteImage(song.coverImageCloudinary.public_id);
            }
        } catch (err) {
            console.error('Error deleting cover image:', err);
        }

        // Delete from database
        await song.deleteOne();

        res.json({ message: 'Media rejected and deleted' });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/edit/:id
// @desc    Edit media metadata
// @access  Admin
router.patch('/edit/:id', async (req, res) => {
    try {
        const { title, artistId, albumId, songLanguage, tags } = req.body;

        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Update allowed fields
        if (title) song.title = title;
        if (artistId !== undefined) song.artist = artistId || null;
        if (albumId !== undefined) song.album = albumId || null;
        if (songLanguage) song.songLanguage = songLanguage;
        if (tags) song.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
        if (req.body.coverImage) song.coverImage = req.body.coverImage;

        await song.save();

        const updated = await Song.findById(song._id)
            .populate('artist', 'name')
            .populate('album', 'title');

        res.json({ message: 'Media updated', song: updated });
    } catch (error) {
        console.error('Edit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========================================
// SETTINGS
// ========================================

// @route   GET /api/admin/settings
// @desc    Get admin settings
// @access  Admin
router.get('/settings', async (req, res) => {
    try {
        const settings = await AdminSettings.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/settings
// @desc    Update admin settings
// @access  Admin
router.post('/settings', async (req, res) => {
    try {
        const { uploadsEnabled, autoApproveUploads, maxUploadSizeMB, maintenanceMode, welcomeMessage } = req.body;

        const updates = {};
        if (typeof uploadsEnabled === 'boolean') updates.uploadsEnabled = uploadsEnabled;
        if (typeof autoApproveUploads === 'boolean') updates.autoApproveUploads = autoApproveUploads;
        if (typeof maxUploadSizeMB === 'number') updates.maxUploadSizeMB = maxUploadSizeMB;
        if (typeof maintenanceMode === 'boolean') updates.maintenanceMode = maintenanceMode;
        if (typeof welcomeMessage === 'string') updates.welcomeMessage = welcomeMessage;

        const settings = await AdminSettings.updateSettings(updates);

        res.json({ message: 'Settings updated', settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========================================
// DASHBOARD STATS
// ========================================

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalSongs,
            totalArtists,
            totalAlbums,
            totalPlaylists,
            pendingSongs,
            approvedSongs,
            recentUploads
        ] = await Promise.all([
            User.countDocuments(),
            Song.countDocuments(),
            Artist.countDocuments(),
            Album.countDocuments(),
            Playlist.countDocuments(),
            Song.countDocuments({ status: 'pending' }),
            Song.countDocuments({ status: 'approved' }),
            Song.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('artist', 'name')
                .populate('uploadedBy', 'displayName')
        ]);

        res.json({
            totalUsers,
            totalSongs,
            totalArtists,
            totalAlbums,
            totalPlaylists,
            pendingSongs,
            approvedSongs,
            recentUploads
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========================================
// BULK OPERATIONS
// ========================================

// @route   POST /api/admin/approve-all
// @desc    Approve all pending media
// @access  Admin
router.post('/approve-all', async (req, res) => {
    try {
        const result = await Song.updateMany(
            { status: 'pending' },
            { status: 'approved' }
        );

        res.json({
            message: 'All pending media approved',
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Approve all error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========================================
// PLAYLISTS (Admin View)
// ========================================

// @route   GET /api/admin/playlists
// @desc    Get all playlists (admin view)
// @access  Admin
router.get('/playlists', async (req, res) => {
    try {
        const playlists = await Playlist.find()
            .populate('owner', 'displayName email')
            .populate('songs', 'title')
            .sort({ createdAt: -1 });

        res.json(playlists);
    } catch (error) {
        console.error('Get playlists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
