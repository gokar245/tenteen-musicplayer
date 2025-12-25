import express from 'express';
import multer from 'multer';
import { parseBuffer } from 'music-metadata';
import { v4 as uuidv4 } from 'uuid';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import Artist from '../models/Artist.js';
import AdminSettings from '../models/AdminSettings.js';
import { protect } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import storage from '../services/storage.js';
import crypto from 'crypto';

const router = express.Router();

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middleware wrapper for multiple fields
const uploadMiddleware = (req, res, next) => {
    try {
        upload.fields([
            { name: 'audio', maxCount: 1 },
            { name: 'coverImage', maxCount: 1 },
            { name: 'artistImage', maxCount: 1 },
            { name: 'albumImage', maxCount: 1 }
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

        const { artistId, albumId, title, language, tags } = req.body;

        // 2. Duplicate Detection
        const hash = crypto.createHash('sha256').update(audioFile.buffer).digest('hex');
        const duplicate = await Song.findOne({ hash });
        if (duplicate) {
            return res.status(409).json({ message: 'Duplicate song detected', songId: duplicate._id });
        }

        // 3. Get admin settings to determine status
        const settings = await AdminSettings.getSettings();

        // 4. Save Audio to Storage (local or Cloudinary)
        const filename = `${uuidv4()}.${audioExt}`;
        const audioResult = await storage.saveAudio(audioFile, filename);

        // 5. Save Cover Image (if present)
        let coverImagePath = null;
        let coverImageCloudinary = null;
        if (coverImageFile) {
            const imageExt = coverImageFile.originalname.split('.').pop().toLowerCase();
            const imageFilename = `${uuidv4()}.${imageExt}`;
            const imageResult = await storage.saveImage(coverImageFile, imageFilename, 'covers');

            if (imageResult.storageType === 'cloudinary') {
                coverImageCloudinary = imageResult.cloudinary;
                coverImagePath = imageResult.cloudinary.secure_url;
            } else {
                coverImagePath = imageResult.url;
            }
        }

        // 6. Metadata Parsing
        let duration = 0;
        let bitrate = null;
        try {
            const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
            duration = metadata.format.duration || 0;
            bitrate = metadata.format.bitrate || null;
        } catch (parseErr) {
            console.warn('Music metadata parsing failed, using default duration:', parseErr.message);
        }

        // 7. Determine status based on settings and user role
        // Admin uploads are ALWAYS auto-approved
        // If uploadsEnabled toggle is ON, user uploads are auto-approved
        // If uploadsEnabled toggle is OFF, user uploads go to pending
        let status = 'pending';
        if (req.user.role === 'admin') {
            // Admin uploads are always approved
            status = 'approved';
        } else if (settings.uploadsEnabled) {
            // Toggle ON = auto-approve regular uploads
            status = 'approved';
        }
        // Toggle OFF = status stays 'pending'

        // 8. Create Database Record
        const songData = {
            title: title || audioFile.originalname.replace(/\.[^/.]+$/, ''),
            artist: artistId || null,
            album: albumId || null,
            duration,
            fileUrl: audioResult.storageType === 'local' ? filename : null,
            cloudinary: audioResult.storageType === 'cloudinary' ? audioResult.cloudinary : null,
            storageType: audioResult.storageType,
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
            message: status === 'approved' ? 'Song uploaded successfully' : 'Song uploaded and pending approval',
            song,
            status
        });

    } catch (error) {
        console.error('Upload Error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Duplicate entry detected' });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
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
            imageUrl: result.url || result.cloudinary?.secure_url,
            cloudinary: result.cloudinary,
            storageType: result.storageType
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Quick test endpoint
router.post('/quick', (req, res) => res.status(200).send('OK'));

// Get upload status/settings (for frontend to know if uploads are enabled)
router.get('/settings', protect, async (req, res) => {
    try {
        const settings = await AdminSettings.getSettings();
        res.json({
            uploadsEnabled: settings.uploadsEnabled,
            autoApprove: settings.autoApproveUploads,
            maxUploadSizeMB: settings.maxUploadSizeMB,
            allowedFormats: settings.allowedFormats
        });
    } catch (error) {
        console.error('Get upload settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
