import mongoose from 'mongoose';
import User from '../models/User.js';
import InviteCode from '../models/InviteCode.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try loading from server root (one level up from scripts)
dotenv.config({ path: path.join(__dirname, '../.env') }); // server/.env
// Or try loading from project root if not found (two levels up?) - assuming server is root of backend.
if (!process.env.MONGO_URI) {
    console.log('MONGO_URI not found in ../.env, trying ../../.env');
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}
if (!process.env.MONGO_URI) {
    // Fallback to hardcoded local if dev environment (risky but for test script ok if user wants)
    // But better to fail with clear error.
    console.error('MONGO_URI is undefined. Please ensure .env exists.');
    process.exit(1);
}

const testTemporaryUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Create a dummy Invite Code with 5 seconds duration
        const duration = 5000; // 5 seconds
        const invite = await InviteCode.create({
            createdBy: new mongoose.Types.ObjectId(), // Fake admin ID
            userType: 'temporary',
            userValidityDuration: duration,
            code: 'TEST_' + Date.now()
        });
        console.log('1. Invite created:', invite.code);

        // 2. Register a User using this Invite (Simulated)
        // We manually creating user as if they registered via API
        const user = await User.create({
            email: `test_temp_${Date.now()}@example.com`,
            password: 'password123',
            displayName: 'Temp User Test',
            invitedBy: invite.createdBy,
            isTemporary: true,
            temporaryValidityDuration: duration,
            temporaryExpiresAt: null,
            firstLoginAt: null
        });
        console.log('2. User registered:', user.email);

        // 3. Mark invite used
        await invite.markAsUsed(user._id);

        // 4. Simulate First Login
        console.log('3. Simulating First Login...');
        user.firstLoginAt = new Date();
        user.temporaryExpiresAt = new Date(Date.now() + duration);
        await user.save();
        console.log('   User logged in. Expires at:', user.temporaryExpiresAt);

        // 5. Wait for expiry
        console.log('4. Waiting 6 seconds for expiry...');
        await new Promise(resolve => setTimeout(resolve, 6000));

        // 6. Simulate Second Login (Check Expiry Logic)
        console.log('5. Simulating Second Login (Expect Deletion)...');
        // Re-fetch user to simulate login check
        let fetchedUser = await User.findById(user._id);
        if (!fetchedUser) {
            console.log('   User not found (Strange, should be found then deleted).');
        } else {
            console.log('   User found, checking expiry logic...');
            if (fetchedUser.isTemporary && fetchedUser.temporaryExpiresAt && Date.now() > fetchedUser.temporaryExpiresAt) {
                console.log('   Expiry condition met. Deleting...');
                await fetchedUser.deleteOne();
                console.log('   User DELETED successfully.');
            } else {
                console.error('   FAILED: User should be expired but condition not met.');
                console.log('   Now:', Date.now(), 'Expires:', fetchedUser.temporaryExpiresAt?.getTime());
            }
        }

        // 7. Verify Deletion
        const finalCheck = await User.findById(user._id);
        if (!finalCheck) {
            console.log('✅ SUCCESS: User no longer exists in DB.');
        } else {
            console.error('❌ FAILURE: User still exists in DB.');
        }

        // Cleanup Invite
        await InviteCode.deleteOne({ _id: invite._id });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testTemporaryUser();
