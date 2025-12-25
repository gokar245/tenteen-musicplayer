import mongoose from 'mongoose';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        let output = 'Connected to DB\n\n';

        const users = await User.find();
        output += '--- USERS ---\n';
        users.forEach(u => output += `${u._id} | ${u.email} | Role: ${u.role} | Name: ${u.displayName}\n`);

        const playlists = await Playlist.find().populate('owner');
        output += '\n--- PLAYLISTS ---\n';
        playlists.forEach(p => output += `${p._id} | ${p.name} | Owner: ${p.owner?._id} (${p.owner?.displayName || p.owner?.email})\n`);

        fs.writeFileSync(path.join(__dirname, 'debug_result.txt'), output);
        console.log('Done');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
