/**
 * Migration script: Migrate existing local/GridFS files to Cloudinary
 * 
 * Usage: node scripts/migrate-to-cloudinary.js
 * 
 * This script will:
 * 1. Find all songs with local storage
 * 2. Upload each to Cloudinary
 * 3. Update the database record
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models and services
import Song from '../models/Song.js';
import cloudinaryService from '../services/cloudinary.js';

// Configuration
const BATCH_SIZE = 5; // Process 5 files at a time
const DRY_RUN = process.argv.includes('--dry-run');
const AUDIO_DIR = path.join(__dirname, '../uploads/audio');
const IMAGES_DIR = path.join(__dirname, '../uploads/images');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function migrateAudio(song) {
    console.log(`\n📦 Processing: ${song.title} (${song._id})`);

    // Check if already migrated
    if (song.storageType === 'cloudinary' && song.cloudinary?.public_id) {
        console.log('  ⏭️  Already migrated to Cloudinary');
        return { success: true, skipped: true };
    }

    // Check if file exists
    const filePath = path.join(AUDIO_DIR, song.fileUrl);
    if (!fs.existsSync(filePath)) {
        console.log(`  ❌ File not found: ${filePath}`);
        return { success: false, error: 'File not found' };
    }

    if (DRY_RUN) {
        console.log('  🔍 [DRY RUN] Would upload:', filePath);
        return { success: true, dryRun: true };
    }

    try {
        // Read file and upload to Cloudinary
        const fileBuffer = await fs.promises.readFile(filePath);
        const publicId = `songs/${song._id}`;

        console.log('  ⬆️  Uploading to Cloudinary...');
        const result = await cloudinaryService.uploadAudioStream(fileBuffer, publicId);

        // Update song record
        song.cloudinary = {
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format,
            secure_url: result.secure_url,
            url: result.url,
            bytes: result.bytes,
            version: result.version
        };
        song.storageType = 'cloudinary';
        await song.save();

        console.log(`  ✅ Uploaded: ${result.secure_url}`);
        return { success: true, result };
    } catch (error) {
        console.error(`  ❌ Upload failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function migrateCoverImage(song) {
    if (!song.coverImage || song.coverImageCloudinary?.public_id) {
        return { success: true, skipped: true };
    }

    // Handle local path (starts with /uploads/images/)
    const imagePath = song.coverImage.startsWith('/uploads/images/')
        ? path.join(__dirname, '..', song.coverImage)
        : path.join(IMAGES_DIR, path.basename(song.coverImage));

    if (!fs.existsSync(imagePath)) {
        console.log(`  ⚠️  Cover image not found: ${imagePath}`);
        return { success: false, error: 'Cover image not found' };
    }

    if (DRY_RUN) {
        console.log('  🔍 [DRY RUN] Would upload cover:', imagePath);
        return { success: true, dryRun: true };
    }

    try {
        console.log('  🖼️  Uploading cover image...');
        const fileBuffer = await fs.promises.readFile(imagePath);
        const publicId = `covers/${song._id}`;
        const result = await cloudinaryService.uploadImage(fileBuffer, publicId, 'covers');

        song.coverImageCloudinary = {
            public_id: result.public_id,
            format: result.format,
            secure_url: result.secure_url,
            url: result.url,
            bytes: result.bytes,
            version: result.version
        };
        song.coverImage = result.secure_url;
        await song.save();

        console.log(`  ✅ Cover uploaded: ${result.secure_url}`);
        return { success: true, result };
    } catch (error) {
        console.error(`  ❌ Cover upload failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function processBatch(songs) {
    const results = [];
    for (const song of songs) {
        const audioResult = await migrateAudio(song);
        const coverResult = await migrateCoverImage(song);
        results.push({
            songId: song._id,
            title: song.title,
            audio: audioResult,
            cover: coverResult
        });
    }
    return results;
}

async function main() {
    console.log('🚀 Starting Migration to Cloudinary');
    console.log('====================================');

    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    if (!cloudinaryService.isConfigured()) {
        console.error('❌ Cloudinary is not configured. Please set environment variables:');
        console.error('   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
        process.exit(1);
    }

    await connectDB();

    // Find songs to migrate
    const query = {
        $or: [
            { storageType: 'local' },
            { storageType: { $exists: false } },
            { cloudinary: { $exists: false } }
        ]
    };

    const totalCount = await Song.countDocuments(query);
    console.log(`\n📊 Found ${totalCount} songs to migrate\n`);

    if (totalCount === 0) {
        console.log('✨ All songs are already migrated!');
        process.exit(0);
    }

    const stats = {
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0
    };

    let skip = 0;
    while (skip < totalCount) {
        const songs = await Song.find(query).skip(skip).limit(BATCH_SIZE);

        console.log(`\n--- Batch ${Math.floor(skip / BATCH_SIZE) + 1} ---`);

        const results = await processBatch(songs);

        for (const result of results) {
            stats.processed++;
            if (result.audio.skipped || result.audio.dryRun) {
                stats.skipped++;
            } else if (result.audio.success) {
                stats.success++;
            } else {
                stats.failed++;
            }
        }

        skip += BATCH_SIZE;

        // Add a small delay between batches to avoid rate limiting
        if (skip < totalCount) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n====================================');
    console.log('📊 Migration Summary');
    console.log('====================================');
    console.log(`Total Processed: ${stats.processed}`);
    console.log(`Successfully Migrated: ${stats.success}`);
    console.log(`Skipped (already migrated): ${stats.skipped}`);
    console.log(`Failed: ${stats.failed}`);

    if (DRY_RUN) {
        console.log('\n🔍 This was a DRY RUN. Run without --dry-run to actually migrate.');
    }

    process.exit(0);
}

main().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
