import express from 'express';
import Song from '../models/Song.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All song routes require authentication
router.use(protect);

// @route   GET /api/songs
// @desc    Get all songs with filters
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { search, artist, limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (artist) {
            query.artist = artist;
        }



        const songs = await Song.find(query)
            .populate('artist', 'name image')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Song.countDocuments(query);

        res.json({
            songs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get songs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/songs/random
// @desc    Get a random song
// @access  Private
router.get('/random', async (req, res) => {
    try {
        const count = await Song.countDocuments();
        const rand = Math.floor(Math.random() * count);
        const song = await Song.findOne().skip(rand)
            .populate('artist', 'name image')


        if (!song) {
            return res.status(404).json({ message: 'No songs found' });
        }
        res.json(song);
    } catch (error) {
        console.error('Get random song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/songs/history
// @desc    Record song playback to user history
// @access  Private
router.post('/history', async (req, res) => {
    try {
        const { songId, progress = 0 } = req.body;

        if (!songId) {
            return res.status(400).json({ message: 'Song ID is required' });
        }

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        const user = await User.findById(req.user._id);

        // Remove any existing entry for this song
        user.playbackHistory = user.playbackHistory.filter(
            h => h.song.toString() !== songId
        );

        // Add to front of history
        user.playbackHistory.unshift({
            song: songId,
            playedAt: new Date(),
            progress: Math.min(Math.max(progress, 0), 1)
        });

        // Keep only last 100 entries
        if (user.playbackHistory.length > 100) {
            user.playbackHistory = user.playbackHistory.slice(0, 100);
        }

        await user.save();

        res.json({ message: 'History updated' });
    } catch (error) {
        console.error('Update history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/songs/history
// @desc    Get user's playback history
// @access  Private
router.get('/history', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const user = await User.findById(req.user._id)
            .populate({
                path: 'playbackHistory.song',
                populate: [
                    { path: 'artist', select: 'name image' },

                ]
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const history = user.playbackHistory
            .filter(h => h.song) // Filter out any deleted songs
            .slice(0, parseInt(limit));

        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/songs/history/recent
// @desc    Get user's recently played songs
// @access  Private
router.get('/history/recent', async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const user = await User.findById(req.user._id)
            .populate({
                path: 'playbackHistory.song',
                populate: [
                    { path: 'artist', select: 'name image' },

                ]
            });

        const history = user.playbackHistory
            .filter(h => h.song) // Filter out any deleted songs
            .slice(0, parseInt(limit));

        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/songs/search/:query
// @desc    Search songs by title
// @access  Private
router.get('/search/:query', async (req, res) => {
    try {
        const songs = await Song.find({
            title: { $regex: req.params.query, $options: 'i' }
        })
            .populate('artist', 'name')

            .limit(10);

        res.json(songs);
    } catch (error) {
        console.error('Search songs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/songs/:id
// @desc    Get song by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artist', 'name image');

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        res.json(song);
    } catch (error) {
        console.error('Get song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/songs/:id
// @desc    Update song details
// @access  Private (owner only)
router.put('/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Only allow update by uploader
        if (song.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this song' });
        }

        const { title, songLanguage, artistId, coverImage } = req.body;

        if (title) song.title = title;
        if (songLanguage) song.songLanguage = songLanguage;
        if (artistId !== undefined) song.artist = artistId || null;
        if (coverImage) song.coverImage = coverImage;

        await song.save();

        const updated = await Song.findById(song._id)
            .populate('artist', 'name image');

        res.json(updated);
    } catch (error) {
        console.error('Update song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/songs/:id
// @desc    Delete a song
// @access  Private (owner only)
router.delete('/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Only allow deletion by uploader
        if (song.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this song' });
        }

        await song.deleteOne();

        res.json({ message: 'Song deleted' });
    } catch (error) {
        console.error('Delete song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
