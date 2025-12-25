
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'http://localhost:5012/api';

async function testUploadv2() {
    try {
        console.log('--- STARTING 500 REPRO ---');
        // 1. Register new user
        const email = 'repro' + Date.now() + '@example.com';
        console.log('Registering user:', email);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            username: 'repro',
            email: email,
            password: 'password123',
            displayName: 'Repro User',
            inviteCode: 'DUMMY'
        });
        const token = regRes.data.token;
        console.log('Got token');

        // 4. Upload Song 
        console.log('Uploading song to MINIMAL ROUTE...');
        const form = new FormData();

        // Correct Order: Fields First
        form.append('artistId', artistId);
        form.append('albumId', albumId);
        form.append('title', 'Repro 500 Song');
        form.append('language', 'English');

        const dummyBuffer = Buffer.from('dummy mp3 content'.repeat(100));
        form.append('audio', dummyBuffer, { filename: 'repro.mp3', contentType: 'audio/mpeg' });

        const uploadRes = await axios.post(`${API_URL}/upload/audio`, form, {
            headers: {
                ...form.getHeaders(),
                // Authorization: `Bearer ${token}` // Disabled for debug
            }
        });

        console.log('Upload Success:', uploadRes.data);

    } catch (error) {
        console.error('Upload Failed Status:', error.response?.status);
        console.error('Upload Failed Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testUploadv2();
