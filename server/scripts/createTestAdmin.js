import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

async function createTestAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.connection.collection('users');

        // Check if admin exists
        const existing = await User.findOne({ email: 'admin@test.com' });

        if (existing) {
            console.log('✓ Admin user already exists');
            console.log('Email: admin@test.com');
            console.log('Password: admin123');
            console.log('Role:', existing.role);
        } else {
            // Create admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await User.insertOne({
                email: 'admin@test.com',
                password: hashedPassword,
                displayName: 'Admin User',
                role: 'admin',
                avatar: null,
                playbackHistory: [],
                invitedBy: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✓ Test admin user created!');
            console.log('Email: admin@test.com');
            console.log('Password: admin123');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createTestAdmin();
