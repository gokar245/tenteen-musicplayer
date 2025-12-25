import mongoose from 'mongoose';

const albumSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Album name is required'],
        trim: true,
        maxlength: [200, 'Album name cannot exceed 200 characters']
    },
    normalizedTitle: {
        type: String,
        required: true,
        trim: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        default: null
    },
    coverImage: {
        type: String,
        default: null
    },
    releaseYear: {
        type: Number,
        min: [1900, 'Invalid release year'],
        max: [new Date().getFullYear() + 1, 'Invalid release year']
    },
    backgroundGradient: {
        type: Object,
        default: {
            colors: ['#667eea', '#764ba2'],
            css: 'linear-gradient(180deg, #667eea 0%, #121212 100%)'
        }
    },
    poster: {
        type: String,
        default: null
    },
    albumLanguage: {
        type: String,
        default: 'Unknown'
    }
}, {
    timestamps: true
});

// Unique index for artist + title
albumSchema.index({ artist: 1, normalizedTitle: 1 }, { unique: true });

// Text index for search
albumSchema.index({ name: 'text' });
albumSchema.index({ name: 1 });
albumSchema.index({ artist: 1 });

const Album = mongoose.model('Album', albumSchema);

export default Album;
