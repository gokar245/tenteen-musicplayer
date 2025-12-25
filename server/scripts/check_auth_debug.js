import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function checkDB() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const User = mongoose.connection.collection('users');
        const count = await User.countDocuments();
        console.log('User count:', count);

        const users = await User.find({}).limit(5).toArray();
        console.log('Recent users:', users.map(u => u.email));

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkDB();
