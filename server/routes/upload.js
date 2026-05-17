import express from 'express';
import multer from 'multer';
import { parseBuffer, parseFile } from 'music-metadata';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import fs from 'fs';
import Song from '../models/Song.js';

import Artist from '../models/Artist.js';
import { protect } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import storage from '../services/storage.js';
import crypto from 'crypto';

const router = express.Router();

// Configure multer
// Configure multer to use disk storage (temporarily) to avoid memory limits
const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const imageUpload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middleware wrapper for multiple fields
const uploadMiddleware = (req, res, next) => {
    try {
        upload.fields([
            { name: 'audio', maxCount: 1 },
            { name: 'coverImage', maxCount: 1 }
        ])(req, res, (err) => {
            if (err) {
                console.error('Multer Middleware Error:', err);
                return res.status(500).json({
                    message: 'Multer Middleware Error',
                    error: err.message
                });
            }
            next();
        });
    } catch (e) {
        console.error('Multer Synchronous Error:', e);
        res.status(500).json({ message: 'Multer Sync Error', stack: e.stack });
    }
};

// Main audio upload endpoint
router.post('/audio', protect, uploadMiddleware, async (req, res) => {
    try {
        const files = req.files || {};
        const audioFile = files['audio'] ? files['audio'][0] : null;
        const coverImageFile = files['coverImage'] ? files['coverImage'][0] : null;

        if (!audioFile) {
            return res.status(400).json({ message: 'No audio file uploaded' });
        }

        // 1. Validations
        if (!audioFile.mimetype.startsWith('audio/')) {
            return res.status(400).json({ message: 'Invalid file type. Only audio files are allowed.' });
        }

        const audioExt = audioFile.originalname.split('.').pop().toLowerCase();
        const allowedFormats = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];
        if (!allowedFormats.includes(audioExt)) {
            return res.status(400).json({ message: `Unsupported audio format: ${audioExt}` });
        }

        const { artistId, title, language, tags } = req.body;

        // 2. Duplicate Detection - Generate unique hash for all uploads
        let hash;
        if (audioFile.buffer) {
            hash = crypto.createHash('sha256').update(audioFile.buffer).digest('hex');
        } else if (audioFile.path) {
            // For disk-based uploads, read file and compute hash
            const fileBuffer = await fs.promises.readFile(audioFile.path);
            hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        } else {
            // Fallback: Generate unique hash using UUID if file data unavailable
            hash = crypto.createHash('sha256').update(uuidv4() + Date.now()).digest('hex');
        }

        // Check for duplicates
        const duplicate = await Song.findOne({ hash });
        if (duplicate) {
            return res.status(409).json({ message: 'Duplicate song detected', songId: duplicate._id });
        }

        // 3. Save Audio to Cloudinary
        const filename = `${uuidv4()}.${audioExt}`;
        const audioResult = await storage.saveAudio(audioFile, filename);

        // 4. Save Cover Image (if present)
        let coverImagePath = null;
        let coverImageCloudinary = null;
        if (coverImageFile) {
            const imageExt = coverImageFile.originalname.split('.').pop().toLowerCase();
            const imageFilename = `${uuidv4()}.${imageExt}`;
            const imageResult = await storage.saveImage(coverImageFile, imageFilename, 'covers');

            coverImageCloudinary = imageResult.cloudinary;
            coverImagePath = imageResult.cloudinary.secure_url;
        }

        // 5. Metadata Parsing
        let duration = 0;
        let bitrate = null;
        try {
            let metadata;
            if (audioFile.path) {
                metadata = await parseFile(audioFile.path);
            } else {
                metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
            }
            duration = metadata.format.duration || 0;
            bitrate = metadata.format.bitrate || null;
        } catch (parseErr) {
            console.warn('Music metadata parsing failed, using default duration:', parseErr.message);
        }

        // 6. All uploads are auto-approved
        const status = 'approved';

        // 7. Create Database Record
        const songData = {
            title: title || audioFile.originalname.replace(/\.[^/.]+$/, ''),
            artist: artistId || null,

            duration,
            fileUrl: null,
            cloudinary: audioResult.cloudinary,
            storageType: 'cloudinary',
            fileSize: audioFile.size,
            format: audioExt,
            uploadedBy: req.user._id,
            hash,
            songLanguage: language || 'Unknown',
            coverImage: coverImagePath,
            coverImageCloudinary,
            status,
            originalFilename: audioFile.originalname,
            bitrate,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
            plays: 0
        };

        const song = await Song.create(songData);

        res.status(201).json({
            message: 'Song uploaded successfully',
            song,
            status
        });

    } catch (error) {
        console.error('Upload Error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Duplicate entry detected' });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
        // CLEANUP: Remove temp files
        const cleanupFile = async (f) => {
            if (f && f.path) {
                try {
                    await fs.promises.unlink(f.path);
                } catch (e) { console.warn('Failed to cleanup temp file:', f.path); }
            }
        };
        if (req.files) {
            await cleanupFile(req.files['audio']?.[0]);
            await cleanupFile(req.files['coverImage']?.[0]);
            await cleanupFile(req.files['artistImage']?.[0]);

        }
    }
});

// Image upload endpoint
router.post('/image', protect, (req, res, next) => {
    imageUpload.single('image')(req, res, (err) => {
        if (err) return res.status(500).json({ message: 'Image upload failed', error: err.message });
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        const { folder = 'general' } = req.body;
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        const filename = `${uuidv4()}.${fileExt}`;
        const result = await storage.saveImage(req.file, filename, folder);

        res.json({
            imageUrl: result.cloudinary?.secure_url,
            cloudinary: result.cloudinary,
            storageType: 'cloudinary'
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (req.file && req.file.path) {
            try {
                await fs.promises.unlink(req.file.path);
            } catch (e) {
                console.warn('Failed to cleanup temp image:', req.file.path);
            }
        }
    }
});

// Quick test endpoint
router.post('/quick', (req, res) => res.status(200).send('OK'));

export default router;
