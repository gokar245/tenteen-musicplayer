import mongoose from 'mongoose';
import Artist from './models/Artist.js';
import Album from './models/Album.js';
import Song from './models/Song.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a dummy artist
        const artist = await Artist.create({
            name: 'Test Artist 123',
            normalizedName: 'test artist 123'
        });
        console.log('Created test artist:', artist._id);

        // Try to delete it (should work as no songs exist)
        const songsCount = await Song.countDocuments({ artist: artist._id });
        if (songsCount === 0) {
            await artist.deleteOne();
            console.log('Successfully deleted empty artist');
        } else {
            console.log('Artist not empty');
        }

        // Create another artist and a song
        const artistWithSong = await Artist.create({
            name: 'Test Artist With Song',
            normalizedName: 'test artist with song'
        });
        console.log('Created artist with song:', artistWithSong._id);

        await Song.create({
            name: 'Test Song',
            artist: artistWithSong._id,
            duration: 180,
            audioUrl: 'http://test.com',
            coverImage: 'http://test.com'
        });

        // Try to delete it (should fail)
        const songsCount2 = await Song.countDocuments({ artist: artistWithSong._id });
        if (songsCount2 > 0) {
            console.log('Delete blocked: Artist has', songsCount2, 'songs');
        } else {
            await artistWithSong.deleteOne();
            console.log('Unexpectedly deleted artist with song');
        }

        // Cleanup the song and then delete artist
        await Song.deleteMany({ artist: artistWithSong._id });
        await artistWithSong.deleteOne();
        console.log('Cleaned up and deleted successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
