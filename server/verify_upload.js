
import fs from 'fs';
import { Blob } from 'buffer';

// Configuration
const BASE_URL = 'http://localhost:5020/api/upload';
const TEST_AUDIO_FILE = 'test_audio.mp3';
const TEST_IMAGE_FILE = 'test_image.jpg';

// Helper to create dummy files
function createDummyFiles() {
    if (!fs.existsSync(TEST_AUDIO_FILE)) {
        fs.writeFileSync(TEST_AUDIO_FILE, 'MOCK AUDIO CONTENT ' + Date.now());
    }
    if (!fs.existsSync(TEST_IMAGE_FILE)) {
        fs.writeFileSync(TEST_IMAGE_FILE, 'MOCK IMAGE CONTENT (pretending to be JPG)');
    }
}

async function testUpload(fileDetails, description, expectedStatus) {
    console.log(`\n--- Testing: ${description} ---`);
    const form = new FormData();
    form.append('artistId', '658300000000000000000000');
    form.append('albumId', '658300000000000000000000');
    form.append('title', 'Test Song ' + Date.now());

    // Append file
    const buffer = fs.readFileSync(fileDetails.path);
    const blob = new Blob([buffer], { type: fileDetails.mimeType });
    form.append('audio', blob, fileDetails.filename);

    try {
        const res = await fetch(`${BASE_URL}/audio`, {
            method: 'POST',
            body: form
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json(); // assuming JSON response
        console.log(`Response:`, data);

        if (res.status === expectedStatus) {
            console.log('✅ PASSED');
        } else {
            console.log(`❌ FAILED (Expected ${expectedStatus}, got ${res.status})`);
        }
    } catch (err) {
        console.error('Request Error:', err.message);
    }
}

async function runTests() {
    createDummyFiles();

    // 1. Valid Audio Upload
    await testUpload({
        path: TEST_AUDIO_FILE,
        filename: 'test_audio.mp3',
        mimeType: 'audio/mpeg'
    }, 'Valid Audio Upload', 201);

    // 2. Invalid Mime Type
    await testUpload({
        path: TEST_IMAGE_FILE,
        filename: 'test_image.jpg',
        mimeType: 'image/jpeg'
    }, 'Invalid Mime Type (Image)', 400);

    // 3. Invalid Extension
    const badExtFile = 'test_fake.exe';
    fs.writeFileSync(badExtFile, 'fake content');
    await testUpload({
        path: badExtFile,
        filename: 'test_fake.exe',
        mimeType: 'audio/mpeg'
    }, 'Invalid Extension', 400);
    fs.unlinkSync(badExtFile);

    // 4. Duplicate Upload
    // Should conflict with step 1 upload
    await testUpload({
        path: TEST_AUDIO_FILE,
        filename: 'test_audio.mp3',
        mimeType: 'audio/mpeg'
    }, 'Duplicate Upload', 409);

    // Cleanup
    // fs.unlinkSync(TEST_AUDIO_FILE);
    // fs.unlinkSync(TEST_IMAGE_FILE);
}

runTests();
