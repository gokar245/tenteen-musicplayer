import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const inviteCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4().slice(0, 8).toUpperCase()
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    usedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    userType: {
        type: String,
        enum: ['permanent', 'temporary'],
        default: 'permanent'
    },
    userValidityDuration: {
        type: Number, // in milliseconds
        default: null
    }
}, {
    timestamps: true
});

inviteCodeSchema.index({ code: 1 });
inviteCodeSchema.index({ createdBy: 1 });

// Check if code is valid (not used and not expired)
inviteCodeSchema.methods.isValid = function () {
    return !this.isUsed && new Date() < this.expiresAt;
};

// Mark code as used
inviteCodeSchema.methods.markAsUsed = async function (userId) {
    this.isUsed = true;
    this.usedBy = userId;
    this.usedAt = new Date();
    await this.save();
};

const InviteCode = mongoose.model('InviteCode', inviteCodeSchema);

export default InviteCode;
