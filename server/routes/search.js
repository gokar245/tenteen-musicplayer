import express from 'express';
import Song from '../models/Song.js';
import Artist from '../models/Artist.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/search
// @desc    Global search across songs, albums, artists, and playlists
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { q, type, limit = 10 } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = { $regex: q, $options: 'i' };
        const limitNum = parseInt(limit);

        let results = {};

        // Search based on type or return all
        if (!type || type === 'all' || type === 'songs') {
            const songs = await Song.find({ title: searchRegex })
                .populate('artist', 'name image')
                .limit(limitNum);
            results.songs = songs;
        }

        if (!type || type === 'all' || type === 'artists') {
            const artists = await Artist.find({ name: searchRegex })
                .limit(limitNum);
            results.artists = artists;
        }

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error during search' });
    }
});

// @route   GET /api/search/global
// @desc    Global search (alias for main search)
// @access  Private
router.get('/global', async (req, res) => {
    try {
        const { query, type, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = { $regex: query, $options: 'i' };
        const limitNum = parseInt(limit);

        let results = {};

        // Search based on type or return all
        if (!type || type === 'all' || type === 'songs') {
            const songs = await Song.find({ title: searchRegex })
                .populate('artist', 'name image')
                .limit(limitNum);
            results.songs = songs;
        }

        if (!type || type === 'all' || type === 'artists') {
            const artists = await Artist.find({ name: searchRegex })
                .limit(limitNum);
            results.artists = artists;
        }

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error during search' });
    }
});

export default router;
