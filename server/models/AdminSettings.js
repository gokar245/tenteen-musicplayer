import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
    // Singleton pattern - only one settings document
    key: {
        type: String,
        default: 'main',
        unique: true
    },
    uploadsEnabled: {
        type: Boolean,
        default: false
    },
    autoApproveUploads: {
        type: Boolean,
        default: false
    },
    maxUploadSizeMB: {
        type: Number,
        default: 50
    },
    allowedFormats: {
        type: [String],
        default: ['mp3', 'm4a', 'wav', 'aac', 'ogg']
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    welcomeMessage: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Static method to get the settings (creates if not exists)
adminSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ key: 'main' });
    if (!settings) {
        settings = await this.create({ key: 'main' });
    }
    return settings;
};

// Static method to update settings
adminSettingsSchema.statics.updateSettings = async function (updates) {
    return this.findOneAndUpdate(
        { key: 'main' },
        updates,
        { new: true, upsert: true, runValidators: true }
    );
};

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

export default AdminSettings;
