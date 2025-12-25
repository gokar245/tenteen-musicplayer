
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dropIndex = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const collection = mongoose.connection.collection('songs');
        try {
            await collection.dropIndex('title_text');
            console.log('✅ Dropped title_text index');
        } catch (err) {
            console.log('Info: title_text index might not exist or name differs:', err.message);
            // List indexes to see
            const indexes = await collection.indexes();
            console.log('Current indexes:', indexes);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

dropIndex();
