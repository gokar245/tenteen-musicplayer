import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function seedAdmin() {
    try {
        console.log('\n🎵 TenTeen Admin User Setup\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get admin details
        const email = await question('Admin email: ');
        const password = await question('Admin password: ');
        const displayName = await question('Display name: ');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user directly in collection
        const User = mongoose.connection.collection('users');

        // Check if user exists
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            console.log('\n⚠️  User with this email already exists.');
            rl.close();
            process.exit(1);
        }

        await User.insertOne({
            email: email.toLowerCase(),
            password: hashedPassword,
            displayName,
            role: 'admin',
            avatar: null,
            playbackHistory: [],
            invitedBy: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('\n✓ Admin user created successfully!');
        console.log('\nYou can now:');
        console.log('1. Login with these credentials');
        console.log('2. Generate invite codes for other users\n');

        rl.close();
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        rl.close();
        process.exit(1);
    }
}

seedAdmin();
