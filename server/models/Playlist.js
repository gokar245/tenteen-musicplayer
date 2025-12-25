import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Playlist name is required'],
        trim: true,
        maxlength: [100, 'Playlist name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song'
    }],
    coverImage: {
        type: String,
        default: null
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    backgroundColor: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

playlistSchema.index({ owner: 1 });
playlistSchema.index({ name: 1 });

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
