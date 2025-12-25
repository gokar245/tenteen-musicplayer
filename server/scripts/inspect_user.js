import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

mongoose.set('strictQuery', false);

const inspectUser = async () => {
    try {
        if (!process.env.MONGODB_URI) { console.error('No MONGODB_URI'); process.exit(1); }
        await mongoose.connect(process.env.MONGODB_URI);
        const email = '1232@gmail.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.log(JSON.stringify({ status: 'NOT_FOUND' }));
        } else {
            const now = new Date();
            const expiresAt = user.temporaryExpiresAt ? new Date(user.temporaryExpiresAt) : null;
            const expired = expiresAt && (now > expiresAt);
            console.log(JSON.stringify({
                status: 'FOUND',
                isTemporary: user.isTemporary,
                expiresAt,
                now,
                expired,
                diff: expiresAt ? expiresAt - now : null
            }, null, 2));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
inspectUser();
