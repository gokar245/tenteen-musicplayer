import express from 'express';
import Song from '../models/Song.js';
import { protect } from '../middleware/auth.js';
import storage from '../services/storage.js';

const router = express.Router();

// @route   GET /api/stream/:songId
// @desc    Stream audio file with byte-range support
// @access  Private
router.get('/:songId', protect, async (req, res) => {
    try {
        const song = await Song.findById(req.params.songId);

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // For Cloudinary storage, redirect to Cloudinary URL
        if (song.storageType === 'cloudinary' && song.cloudinary?.secure_url) {
            return res.redirect(song.cloudinary.secure_url);
        }

        // For local storage, stream the file
        if (!song.fileUrl) {
            return res.status(404).json({ message: 'Audio file not found' });
        }

        const stats = await storage.getAudioStats(song.fileUrl);
        const fileSize = stats.size;
        const range = req.headers.range;

        // Determine content type
        const contentTypes = {
            'mp3': 'audio/mpeg',
            'm4a': 'audio/mp4',
            'wav': 'audio/wav',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg'
        };
        const contentType = contentTypes[song.format] || 'audio/mpeg';

        if (range) {
            // Parse Range header
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            // Validate range
            if (start >= fileSize || end >= fileSize) {
                res.status(416).set({
                    'Content-Range': `bytes */${fileSize}`
                });
                return res.end();
            }

            const chunkSize = end - start + 1;

            // Set headers for partial content
            res.status(206).set({
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });

            // Create read stream for the requested range
            const stream = storage.createReadStream(song.fileUrl, { start, end });

            stream.on('error', (error) => {
                console.error('Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error streaming file' });
                }
            });

            stream.pipe(res);
        } else {
            // No range header - send entire file
            res.set({
                'Accept-Ranges': 'bytes',
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });

            const stream = storage.createReadStream(song.fileUrl);

            stream.on('error', (error) => {
                console.error('Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error streaming file' });
                }
            });

            stream.pipe(res);
        }
    } catch (error) {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error during streaming' });
        }
    }
});

export default router;
