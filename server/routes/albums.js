import express from 'express';
import Album from '../models/Album.js';
import Artist from '../models/Artist.js';
import Song from '../models/Song.js';
import { protect, adminOnly } from '../middleware/auth.js';
import normalize from '../utils/normalization.js';

const router = express.Router();

// All album routes require authentication
router.use(protect);

// @route   GET /api/albums
// @desc    Get all albums
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { query, artistId, limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        let findQuery = {};

        if (query) {
            findQuery.name = { $regex: query, $options: 'i' };
        }

        if (artistId) {
            findQuery.artist = artistId;
        }

        const albums = await Album.find(findQuery)
            .populate('artist', 'name image')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Album.countDocuments(findQuery);

        res.json({
            albums,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get albums error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/albums/:id
// @desc    Get album by ID with songs
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const album = await Album.findById(req.params.id)
            .populate('artist', 'name image');

        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        // Get all songs in this album
        const songs = await Song.find({ album: album._id })
            .populate('artist', 'name')
            .sort({ trackNumber: 1 });

        res.json({
            album,
            songs
        });
    } catch (error) {
        console.error('Get album error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/albums
// @desc    Create new album
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { name, artist, coverImage, releaseYear, dominantColor, language, manualColor } = req.body;

        // Check if album name is provided
        if (!name) {
            return res.status(400).json({ message: 'Album name is required' });
        }

        const normalizedTitle = normalize(name);

        // Check if album already exists for this artist (if artist provided)
        // If artist is null, we check only by name? or allow duplicates?
        // Assuming unique name if artist is null
        const uniqueCheck = { normalizedTitle };
        if (artist) {
            uniqueCheck.artist = artist;
        } else {
            uniqueCheck.artist = null;
        }

        const existingAlbum = await Album.findOne(uniqueCheck);

        if (existingAlbum) {
            return res.status(409).json({
                message: 'Album exists',
                album: existingAlbum
            });
        }

        const album = await Album.create({
            name,
            normalizedTitle,
            artist: artist || null,
            coverImage: req.body.poster || coverImage,
            poster: req.body.poster || coverImage,
            releaseYear,
            dominantColor,
            backgroundGradient: req.body.backgroundGradient || {
                colors: ['#667eea', '#764ba2'],
                css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            albumLanguage: language || 'Unknown',
            manualColor
        });

        const populatedAlbum = await Album.findById(album._id)
            .populate('artist', 'name image');

        res.status(201).json(populatedAlbum);
    } catch (error) {
        console.error('Create album error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/albums/:id
// @desc    Update album
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { name, coverImage, releaseYear, dominantColor, language, manualColor } = req.body;

        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        if (name) {
            album.name = name;
            album.normalizedTitle = normalize(name);
        }
        if (coverImage) album.coverImage = coverImage;
        if (req.body.poster) album.poster = req.body.poster;
        if (releaseYear) album.releaseYear = releaseYear;
        // Legacy or sync
        if (dominantColor) album.dominantColor = dominantColor;
        if (req.body.backgroundGradient) album.backgroundGradient = req.body.backgroundGradient;

        if (language) album.albumLanguage = language;
        if (manualColor !== undefined) album.manualColor = manualColor;

        await album.save();

        const populatedAlbum = await Album.findById(album._id)
            .populate('artist', 'name image');

        res.json(populatedAlbum);
    } catch (error) {
        console.error('Update album error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/albums/search/:query
// @desc    Search albums by name
// @access  Private
router.get('/search/:query', async (req, res) => {
    try {
        const albums = await Album.find({
            name: { $regex: req.params.query, $options: 'i' }
        })
            .populate('artist', 'name')
            .limit(10);

        res.json(albums);
    } catch (error) {
        console.error('Search albums error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/albums/:id
// @desc    Delete album ONLY if empty (no songs)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        // Check if album has any songs
        const songsCount = await Song.countDocuments({ album: album._id });

        if (songsCount > 0) {
            return res.status(400).json({
                message: `Unable to delete album. This album has ${songsCount} songs. Please delete all the songs first.`
            });
        }

        await Album.findByIdAndDelete(req.params.id);

        res.json({ message: 'Album deleted successfully' });
    } catch (error) {
        console.error('Delete album error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
