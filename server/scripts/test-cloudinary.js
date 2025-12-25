/**
 * Cloudinary Configuration Test Script
 * Run with: node scripts/test-cloudinary.js
 */

import dotenv from 'dotenv';
dotenv.config();

import cloudinaryService from '../services/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Cloudinary Configuration...\n');

// Check if configured
if (!cloudinaryService.isConfigured()) {
    console.log('❌ Cloudinary is NOT configured!');
    console.log('\nPlease add these environment variables to your .env file:');
    console.log('  CLOUDINARY_CLOUD_NAME=your-cloud-name');
    console.log('  CLOUDINARY_API_KEY=your-api-key');
    console.log('  CLOUDINARY_API_SECRET=your-api-secret');
    console.log('  STORAGE_TYPE=cloudinary');
    process.exit(1);
}

console.log('✅ Cloudinary credentials found!\n');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('   API Key:', process.env.CLOUDINARY_API_KEY?.substring(0, 8) + '...');
console.log('   Storage Type:', process.env.STORAGE_TYPE || 'local (default)');
console.log('');

// Test image upload
const testImageUpload = async () => {
    console.log('📷 Testing image upload...');

    // Create a simple test image (1x1 pixel red PNG)
    const testBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q1bIvwAAAABJRU5ErkJggg==',
        'base64'
    );

    try {
        const result = await cloudinaryService.uploadImage(testBuffer, 'test-image-' + Date.now(), 'tests');
        console.log('   ✅ Image uploaded successfully!');
        console.log('   URL:', result.secure_url);

        // Clean up - delete the test image
        await cloudinaryService.deleteResource(result.public_id, 'image');
        console.log('   ✅ Test image deleted\n');

        return true;
    } catch (error) {
        console.log('   ❌ Image upload failed:', error.message);
        return false;
    }
};

// Test audio upload
const testAudioUpload = async () => {
    console.log('🎵 Testing audio upload...');

    // Create a simple test file (not a real audio, just for connection testing)
    const testBuffer = Buffer.from('This is a test file for Cloudinary connection.');

    try {
        const result = await cloudinaryService.uploadAudioStream(testBuffer, 'test-audio-' + Date.now());
        console.log('   ✅ Audio uploaded successfully!');
        console.log('   URL:', result.secure_url);

        // Clean up
        await cloudinaryService.deleteResource(result.public_id, 'raw');
        console.log('   ✅ Test audio deleted\n');

        return true;
    } catch (error) {
        console.log('   ❌ Audio upload failed:', error.message);
        return false;
    }
};

// Run tests
const runTests = async () => {
    const imageResult = await testImageUpload();
    const audioResult = await testAudioUpload();

    console.log('========================================');
    if (imageResult && audioResult) {
        console.log('🎉 All tests passed! Cloudinary is working properly.');
        console.log('\nYour uploads will now go to Cloudinary.');
        console.log('MongoDB will only store metadata and Cloudinary URLs.');
    } else {
        console.log('⚠️  Some tests failed. Please check your Cloudinary configuration.');
    }
    console.log('========================================');

    process.exit(imageResult && audioResult ? 0 : 1);
};

runTests();
