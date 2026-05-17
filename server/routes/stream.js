import express from 'express';
import Song from '../models/Song.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/stream/:songId
// @desc    Stream audio file via redirect to Cloudinary
// @access  Private
router.get('/:songId', protect, async (req, res) => {
    try {
        const song = await Song.findById(req.params.songId);

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // For Cloudinary storage, redirect to Cloudinary URL
        if (song.cloudinary?.secure_url) {
            return res.redirect(song.cloudinary.secure_url);
        }

        return res.status(404).json({ message: 'Audio stream not available' });

    } catch (error) {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error during streaming' });
        }
    }
});

export default router;
