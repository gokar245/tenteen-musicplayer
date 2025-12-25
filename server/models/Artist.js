import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Artist name is required'],
        trim: true,
        maxlength: [100, 'Artist name cannot exceed 100 characters']
    },
    normalizedName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: [1000, 'Bio cannot exceed 1000 characters'],
        default: ''
    },
    backgroundGradient: {
        type: Object,
        default: {
            colors: ['#667eea', '#764ba2'],
            css: 'linear-gradient(180deg, #667eea 0%, #121212 100%)'
        }
    },
    photo: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Text index for search
artistSchema.index({ name: 'text' });
artistSchema.index({ name: 1 });

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;
