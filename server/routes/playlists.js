import express from 'express';
import Playlist from '../models/Playlist.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All playlist routes require authentication
router.use(protect);

// @route   GET /api/playlists
// @desc    Get user's playlists
// @access  Private
router.get('/', async (req, res) => {
    try {
        let query = { owner: req.user._id };

        // If admin, allow seeing everything
        if (req.user.role === 'admin') {
            query = {};
        }

        const playlists = await Playlist.find(query)
            .populate('songs')
            .populate('owner', 'displayName')
            .sort({ createdAt: -1 });

        res.json(playlists);
    } catch (error) {
        console.error('Get playlists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/playlists/public
// @desc    Get all public playlists
// @access  Private
router.get('/public', async (req, res) => {
    try {
        const playlists = await Playlist.find({ isPublic: true })
            .populate('songs')
            .populate('owner', 'displayName')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(playlists);
    } catch (error) {
        console.error('Get public playlists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/playlists/:id
// @desc    Get playlist by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate({
                path: 'songs',
                populate: [
                    { path: 'artist', select: 'name' },
                    { path: 'album', select: 'name coverImage' }
                ]
            })
            .populate('owner', 'displayName');

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Check access: Public or Owner or Admin
        const isOwner = playlist.owner._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!playlist.isPublic && !isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(playlist);
    } catch (error) {
        console.error('Get playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/playlists
// @desc    Create new playlist
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Playlist name is required' });
        }

        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user._id,
            isPublic: isPublic || false,
            songs: []
        });

        res.status(201).json(playlist);
    } catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/playlists/:id
// @desc    Update playlist
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        const isOwner = playlist.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { name, description, isPublic, coverImage, backgroundColor } = req.body;

        if (name) playlist.name = name;
        if (description !== undefined) playlist.description = description;
        if (isPublic !== undefined) playlist.isPublic = isPublic;
        if (coverImage) playlist.coverImage = coverImage;
        if (backgroundColor) playlist.backgroundColor = backgroundColor;

        await playlist.save();

        res.json(playlist);
    } catch (error) {
        console.error('Update playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/playlists/:id/songs
// @desc    Add song to playlist
// @access  Private
router.post('/:id/songs', async (req, res) => {
    try {
        const { songId } = req.body;

        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        const isOwner = playlist.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if song already in playlist
        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ message: 'Song already in playlist' });
        }

        playlist.songs.push(songId);
        await playlist.save();

        const updated = await Playlist.findById(playlist._id)
            .populate({
                path: 'songs',
                populate: [
                    { path: 'artist', select: 'name' },
                    { path: 'album', select: 'name coverImage' }
                ]
            });

        res.json(updated);
    } catch (error) {
        console.error('Add song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/playlists/:id/songs/:songId
// @desc    Remove song from playlist
// @access  Private
router.delete('/:id/songs/:songId', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        const isOwner = playlist.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        playlist.songs = playlist.songs.filter(
            s => s.toString() !== req.params.songId
        );
        await playlist.save();

        res.json(playlist);
    } catch (error) {
        console.error('Remove song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/playlists/:id
// @desc    Delete playlist
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        const isOwner = playlist.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await playlist.deleteOne();

        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
