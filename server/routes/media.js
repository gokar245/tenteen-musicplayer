import express from 'express';
import Song from '../models/Song.js';
import { protect } from '../middleware/auth.js';
import storage from '../services/storage.js';

const router = express.Router();

// @route   GET /api/media
// @desc    Get all approved media
// @access  Protected
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, artist, album, language, search } = req.query;
        const skip = (page - 1) * limit;

        const query = { status: 'approved' };

        if (artist) query.artist = artist;
        if (album) query.album = album;
        if (language) query.songLanguage = language;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const songs = await Song.find(query)
            .populate('artist', 'name image')
            .populate('album', 'title coverImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Song.countDocuments(query);

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
        console.error('Get media error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/media/:id
// @desc    Get single media details
// @access  Protected
router.get('/:id', protect, async (req, res) => {
    try {
        const song = await Song.findOne({ _id: req.params.id, status: 'approved' })
            .populate('artist', 'name image')
            .populate('album', 'title coverImage poster');

        if (!song) {
            return res.status(404).json({ message: 'Media not found' });
        }

        res.json(song);
    } catch (error) {
        console.error('Get media by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/media/:id/url
// @desc    Get streaming URL (signed for private content)
// @access  Protected
router.get('/:id/url', protect, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // For Cloudinary storage, return the secure URL
        if (song.storageType === 'cloudinary' && song.cloudinary?.secure_url) {
            // For public content, return direct URL
            // For private content, generate signed URL
            const url = song.cloudinary.secure_url;

            return res.json({
                url,
                storageType: 'cloudinary',
                format: song.format,
                duration: song.duration
            });
        }

        // For local storage, return streaming endpoint
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;
        const url = `/api/stream/${song._id}?token=${token}`;

        res.json({
            url,
            storageType: 'local',
            format: song.format,
            duration: song.duration
        });
    } catch (error) {
        console.error('Get media URL error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/media/languages
// @desc    Get all unique languages
// @access  Protected
router.get('/meta/languages', protect, async (req, res) => {
    try {
        const languages = await Song.distinct('songLanguage', { status: 'approved' });
        res.json(languages.filter(Boolean));
    } catch (error) {
        console.error('Get languages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/media/meta/formats
// @desc    Get all unique formats
// @access  Protected
router.get('/meta/formats', protect, async (req, res) => {
    try {
        const formats = await Song.distinct('format', { status: 'approved' });
        res.json(formats.filter(Boolean));
    } catch (error) {
        console.error('Get formats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
