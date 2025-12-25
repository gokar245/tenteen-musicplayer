import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkPass = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'afroz24shaik@gmail.com';
        const pass = '245245';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }

        console.log('User found:', user.email);
        console.log('Stored Hash:', user.password);

        const isMatch = await bcrypt.compare(pass, user.password);
        console.log('Password "245245" match:', isMatch);

        if (!isMatch) {
            console.log('Resetting password to "245245"...');
            // We need to fetch again to ensure we use the schema's pre-save hook for hashing? 
            // OR just set it. The pre-save hook hashes if modified.
            user.password = pass;
            await user.save();
            console.log('Password reset complete.');

            const newUser = await User.findOne({ email });
            const newMatch = await bcrypt.compare(pass, newUser.password);
            console.log('Re-verification:', newMatch);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

checkPass();
