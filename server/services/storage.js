import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinaryService from './cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalStorage {
    constructor() {
        this.uploadDir = process.env.UPLOAD_DIR || './uploads';
        this.audioDir = path.join(this.uploadDir, 'audio');
        this.imagesDir = path.join(this.uploadDir, 'images');
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.uploadDir, this.audioDir, this.imagesDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async saveAudio(file, filename) {
        if (file.path) {
            // If file is on disk (from diskStorage)
            const filePath = path.join(this.audioDir, filename);
            await fs.promises.copyFile(file.path, filePath);
            return { filename, storagePath: filePath, storageType: 'local' };
        } else {
            // Buffer fallback
            const filePath = path.join(this.audioDir, filename);
            await fs.promises.writeFile(filePath, file.buffer);
            return { filename, storagePath: filePath, storageType: 'local' };
        }
    }

    async saveImage(file, filename) {
        const filePath = path.join(this.imagesDir, filename);
        if (file.path) {
            await fs.promises.copyFile(file.path, filePath);
        } else {
            await fs.promises.writeFile(filePath, file.buffer);
        }
        return { url: `/uploads/images/${filename}`, storageType: 'local' };
    }

    getAudioPath(filename) {
        return path.join(this.audioDir, filename);
    }

    getImagePath(filename) {
        return path.join(this.imagesDir, filename);
    }

    async deleteAudio(filename) {
        const filePath = path.join(this.audioDir, filename);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    async deleteImage(filename) {
        const filePath = path.join(this.imagesDir, filename);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    async getAudioStats(filename) {
        const filePath = path.join(this.audioDir, filename);
        return await fs.promises.stat(filePath);
    }

    createReadStream(filename, options = {}) {
        const filePath = path.join(this.audioDir, filename);
        return fs.createReadStream(filePath, options);
    }
}

class CloudinaryStorage {
    constructor() {
        if (!cloudinaryService.isConfigured()) {
            console.warn('Cloudinary not configured. Using local storage fallback.');
            this.fallback = new LocalStorage();
        }
    }

    async saveAudio(file, filename) {
        if (this.fallback) return this.fallback.saveAudio(file, filename);

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
        if (this.fallback) return this.fallback.saveImage(file, filename);

        try {
            const publicId = filename.replace(/\.[^/.]+$/, '');
            let result;

            if (file.path) {
                // Convert file path to buffer for specific image upload if needed
                // Or update cloudinary service to support path for images (it does handle paths usually)
                // But uploadImage in cloudinary.js handles paths directly if string
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
        // For Cloudinary, return the filename as-is (URL will be retrieved differently)
        return filename;
    }

    async deleteAudio(publicIdOrFilename) {
        if (this.fallback) return this.fallback.deleteAudio(publicIdOrFilename);

        try {
            await cloudinaryService.deleteResource(publicIdOrFilename, 'video');
        } catch (error) {
            console.error('Failed to delete from Cloudinary:', error);
        }
    }

    async deleteImage(publicIdOrFilename) {
        if (this.fallback) return this.fallback.deleteImage(publicIdOrFilename);

        try {
            await cloudinaryService.deleteResource(publicIdOrFilename, 'image');
        } catch (error) {
            console.error('Failed to delete image from Cloudinary:', error);
        }
    }

    async getAudioStats(publicId) {
        if (this.fallback) return this.fallback.getAudioStats(publicId);

        try {
            return await cloudinaryService.getResourceInfo(publicId, 'video');
        } catch (error) {
            console.error('Failed to get resource info:', error);
            throw error;
        }
    }

    createReadStream(filename, options = {}) {
        // For Cloudinary, we don't use streams - use secure_url directly
        if (this.fallback) return this.fallback.createReadStream(filename, options);
        throw new Error('Cloudinary does not support createReadStream. Use secure_url instead.');
    }

    getSignedUrl(publicId, expiresInSeconds = 3600) {
        return cloudinaryService.generateSignedUrl(publicId, 'video', expiresInSeconds);
    }
}

// Storage factory - easy to swap providers later
class StorageService {
    constructor() {
        const storageType = process.env.STORAGE_TYPE ? process.env.STORAGE_TYPE.trim() : 'local';
        console.log('DEBUG: Raw STORAGE_TYPE:', process.env.STORAGE_TYPE);
        console.log('DEBUG: storageType used:', storageType);
        console.log('DEBUG: CWD:', process.cwd());

        switch (storageType) {
            case 'cloudinary':
                this.provider = new CloudinaryStorage();
                console.log('📦 Using Cloudinary storage');
                break;
            case 'local':
            default:
                this.provider = new LocalStorage();
                console.log('📦 Using local storage');
                break;
        }

        this.storageType = storageType;
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
        if (this.storageType === 'cloudinary') {
            return this.provider.getSignedUrl(publicId);
        }
        return null;
    }

    isCloudinary() {
        return this.storageType === 'cloudinary';
    }
}

export const storage = new StorageService();
export default storage;
