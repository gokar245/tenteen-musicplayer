import mongoose from 'mongoose';

const cloudinarySubSchema = new mongoose.Schema({
    public_id: String,
    resource_type: String,
    format: String,
    secure_url: String,
    url: String,
    bytes: Number,
    version: Number
}, { _id: false });

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Song title is required'],
        trim: true,
        maxlength: [200, 'Song title cannot exceed 200 characters']
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        default: null
    },
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        default: null
    },
    coverImage: {
        type: String,
        default: null
    },
    coverImageCloudinary: {
        type: cloudinarySubSchema,
        default: null
    },
    duration: {
        type: Number,
        required: true,
        min: [0, 'Duration cannot be negative']
    },
    trackNumber: {
        type: Number,
        default: 1,
        min: [1, 'Track number must be at least 1']
    },
    // Legacy local storage field
    fileUrl: {
        type: String,
        default: null
    },
    // Cloudinary storage
    cloudinary: {
        type: cloudinarySubSchema,
        default: null
    },
    // Storage type indicator
    storageType: {
        type: String,
        enum: ['local', 'cloudinary', 'gridfs'],
        default: 'local'
    },
    fileSize: {
        type: Number,
        required: true
    },
    format: {
        type: String,
        enum: ['mp3', 'm4a', 'wav', 'aac', 'ogg'],
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songLanguage: {
        type: String,
        default: 'Unknown',
        trim: true
    },
    hash: {
        type: String,
        required: true,
        unique: true
    },
    manualColor: {
        type: String
    },
    // Upload status for moderation
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Original filename for reference
    originalFilename: {
        type: String
    },
    // Tags for categorization
    tags: {
        type: [String],
        default: []
    },
    // Bitrate info
    bitrate: {
        type: Number,
        default: null
    },
    // Play count
    plays: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Virtual to get the streaming URL
songSchema.virtual('streamUrl').get(function () {
    if (this.cloudinary && this.cloudinary.secure_url) {
        return this.cloudinary.secure_url;
    }
    return this.fileUrl ? `/api/stream/${this._id}` : null;
});

// Virtual to get cover image URL (prefer cloudinary)
songSchema.virtual('coverUrl').get(function () {
    if (this.coverImageCloudinary && this.coverImageCloudinary.secure_url) {
        return this.coverImageCloudinary.secure_url;
    }
    return this.coverImage;
});

// Text index for search
songSchema.index({ title: 'text' });
songSchema.index({ artist: 1 });
songSchema.index({ album: 1 });
songSchema.index({ status: 1 });
songSchema.index({ uploadedBy: 1 });

// Ensure virtuals are included in JSON/Object output
songSchema.set('toJSON', { virtuals: true });
songSchema.set('toObject', { virtuals: true });

const Song = mongoose.model('Song', songSchema);

export default Song;
