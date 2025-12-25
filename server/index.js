import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { protect, apiLimiter } from './middleware/index.js';
import {
    authRoutes,
    adminRoutes,
    artistRoutes,
    albumRoutes,
    songRoutes,
    playlistRoutes,
    streamRoutes,
    uploadRoutes,
    searchRoutes,
    mediaRoutes
} from './routes/index.js';

// ES Module path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Connect to database
// Database connection will be handled before server startup

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for API routes
// app.use('/api', apiLimiter);

// Serve uploaded files (images only - audio goes through streaming endpoint)
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/media', mediaRoutes);

// Protected route helper for auth routes that need protect middleware
app.get('/api/auth/me', protect, async (req, res) => {
    res.json(req.user);
});

app.put('/api/auth/profile', protect, async (req, res, next) => {
    // Forward to auth routes
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 50}MB`
            });
        }
        return res.status(400).json({ message: err.message });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        stack: err.stack,
        debug: 'Global Handler'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Connect to database and then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║   🎵 TenTeen Server Running              ║
║                                          ║
║   Port: ${PORT}                            ║
║   Mode: ${process.env.NODE_ENV || 'development'}                  ║
║                                          ║
╚══════════════════════════════════════════╝
      `);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

export default app;
