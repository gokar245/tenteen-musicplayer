import express from 'express';
import Artist from '../models/Artist.js';
import Album from '../models/Album.js';
import Song from '../models/Song.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

import normalize from '../utils/normalization.js';

// All artist routes require authentication
router.use(protect);

// @route   GET /api/artists
// @desc    Get all artists
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { query, limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        let findQuery = {};

        if (query) {
            findQuery.name = { $regex: query, $options: 'i' };
        }

        const artists = await Artist.find(findQuery)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ name: 1 });

        const total = await Artist.countDocuments(findQuery);

        res.json({
            artists,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get artists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   GET /api/artists/:id
// @desc    Get artist by ID with albums and songs
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);

        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        // Get albums by this artist
        const albums = await Album.find({ artist: artist._id })
            .sort({ releaseYear: -1 });

        // Get all songs by this artist
        const songs = await Song.find({ artist: artist._id })
            .populate('album', 'name coverImage')
            .sort({ trackNumber: 1 });

        res.json({
            artist,
            albums,
            songs
        });
    } catch (error) {
        console.error('Get artist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/artists
// @desc    Create new artist
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { name, image, bio, dominantColor } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Artist name is required' });
        }

        const normalizedName = normalize(name);

        // Check if artist already exists
        const existingArtist = await Artist.findOne({ normalizedName });

        if (existingArtist) {
            return res.status(409).json({
                message: 'Artist already exists - select it',
                artist: existingArtist
            });
        }

        const artist = await Artist.create({
            name,
            normalizedName,
            image: image || req.body.photo, // Support both fields
            photo: req.body.photo || image,
            bio,
            backgroundGradient: req.body.backgroundGradient || {
                colors: ['#667eea', '#764ba2'],
                css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }
        });

        res.status(201).json(artist);
    } catch (error) {
        console.error('Create artist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   PUT /api/artists/:id
// @desc    Update artist
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { name, image, bio, dominantColor } = req.body;

        const artist = await Artist.findById(req.params.id);

        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        if (name) {
            artist.name = name;
            artist.normalizedName = normalize(name);
        }
        if (image) artist.image = image;
        if (req.body.photo) artist.photo = req.body.photo;
        if (bio !== undefined) artist.bio = bio;
        if (req.body.backgroundGradient) artist.backgroundGradient = req.body.backgroundGradient;

        // Ensure legacy dominantColor logic doesn't overwrite new gradient if not needed
        if (dominantColor && !req.body.backgroundGradient && !artist.backgroundGradient) {
            artist.backgroundGradient = {
                colors: [dominantColor, '#000000'],
                css: `linear-gradient(135deg, ${dominantColor}, #000000)`
            };
        }

        await artist.save();

        res.json(artist);
    } catch (error) {
        console.error('Update artist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/artists/search/:query
// @desc    Search artists by name
// @access  Private
router.get('/search/:query', async (req, res) => {
    try {
        const artists = await Artist.find({
            name: { $regex: req.params.query, $options: 'i' }
        }).limit(10);

        res.json(artists);
    } catch (error) {
        console.error('Search artists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/artists/:id
// @desc    Delete artist ONLY if empty (no songs, no albums)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);

        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        // Check for songs
        const songsCount = await Song.countDocuments({ artist: artist._id });
        if (songsCount > 0) {
            return res.status(400).json({
                message: `Unable to delete artist. This artist has ${songsCount} songs. Please delete all the songs first.`
            });
        }

        // Check for albums
        const albumsCount = await Album.countDocuments({ artist: artist._id });
        if (albumsCount > 0) {
            return res.status(400).json({
                message: `Unable to delete artist. This artist has ${albumsCount} albums. Please delete all the albums first.`
            });
        }

        await Artist.findByIdAndDelete(req.params.id);

        res.json({ message: 'Artist deleted successfully' });
    } catch (error) {
        console.error('Delete artist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
