import cloudinaryService from './cloudinary.js';

class CloudinaryStorage {
    constructor() {
        if (!cloudinaryService.isConfigured()) {
            throw new Error('Cloudinary is not configured. Local storage has been disabled.');
        }
    }

    async saveAudio(file, filename) {
        try {
            // Generate public ID from filename (without extension)
            const publicId = filename.replace(/\.[^/.]+$/, '');
            let result;

            if (file.path) {
                // Upload from disk path
                result = await cloudinaryService.uploadAudioFile(file.path, publicId);
            } else {
                // Upload from buffer
                result = await cloudinaryService.uploadAudioStream(file.buffer, publicId);
            }

            return {
                cloudinary: {
                    public_id: result.public_id,
                    resource_type: result.resource_type,
                    format: result.format,
                    secure_url: result.secure_url,
                    url: result.url,
                    bytes: result.bytes,
                    version: result.version
                },
                storageType: 'cloudinary'
            };
        } catch (error) {
            console.error('Cloudinary upload failed:', error);
            throw error;
        }
    }

    async saveImage(file, filename, folder = 'general') {
        try {
            const publicId = filename.replace(/\.[^/.]+$/, '');
            let result;

            if (file.path) {
                result = await cloudinaryService.uploadImage(file.path, publicId, folder);
            } else {
                result = await cloudinaryService.uploadImage(file.buffer, publicId, folder);
            }

            return {
                cloudinary: {
                    public_id: result.public_id,
                    format: result.format,
                    secure_url: result.secure_url,
                    url: result.url,
                    bytes: result.bytes,
                    version: result.version
                },
                url: result.secure_url,
                storageType: 'cloudinary'
            };
        } catch (error) {
            console.error('Cloudinary image upload failed:', error);
            throw error;
        }
    }

    getAudioPath(filename) {
        return filename;
    }

    async deleteAudio(publicIdOrFilename) {
        try {
            await cloudinaryService.deleteResource(publicIdOrFilename, 'video');
        } catch (error) {
            console.error('Failed to delete from Cloudinary:', error);
        }
    }

    async deleteImage(publicIdOrFilename) {
        try {
            await cloudinaryService.deleteResource(publicIdOrFilename, 'image');
        } catch (error) {
            console.error('Failed to delete image from Cloudinary:', error);
        }
    }

    async getAudioStats(publicId) {
        try {
            return await cloudinaryService.getResourceInfo(publicId, 'video');
        } catch (error) {
            console.error('Failed to get resource info:', error);
            throw error;
        }
    }

    createReadStream(filename, options = {}) {
        throw new Error('Cloudinary does not support createReadStream. Use secure_url instead.');
    }

    getSignedUrl(publicId, expiresInSeconds = 3600) {
        return cloudinaryService.generateSignedUrl(publicId, 'video', expiresInSeconds);
    }
}

// Storage factory - easy to swap providers later
class StorageService {
    constructor() {
        this.provider = new CloudinaryStorage();
        this.storageType = 'cloudinary';
        console.log('📦 Using Cloudinary storage exclusively');
    }

    async saveAudio(file, filename) {
        return await this.provider.saveAudio(file, filename);
    }

    async saveImage(file, filename, folder) {
        return await this.provider.saveImage(file, filename, folder);
    }

    getAudioPath(filename) {
        return this.provider.getAudioPath(filename);
    }

    async deleteAudio(filenameOrPublicId) {
        return await this.provider.deleteAudio(filenameOrPublicId);
    }

    async deleteImage(filenameOrPublicId) {
        return await this.provider.deleteImage(filenameOrPublicId);
    }

    async getAudioStats(filenameOrPublicId) {
        return await this.provider.getAudioStats(filenameOrPublicId);
    }

    createReadStream(filename, options = {}) {
        return this.provider.createReadStream(filename, options);
    }

    getSignedUrl(publicId) {
        return this.provider.getSignedUrl(publicId);
    }

    isCloudinary() {
        return true;
    }
}

export const storage = new StorageService();
export default storage;
