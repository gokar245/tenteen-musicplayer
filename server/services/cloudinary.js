import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload audio stream to Cloudinary (resource_type: 'raw' for audio files)
 * @param {Buffer|Stream} fileBuffer - File buffer or stream
 * @param {string} publicId - Public ID for the resource (path in Cloudinary)
 * @returns {Promise} Cloudinary upload result
 */
async function uploadAudioStream(fileBuffer, publicId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                public_id: publicId,
                overwrite: true,
                folder: 'tenteen/raw/songs'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        // Convert buffer to stream and pipe
        const readable = new Readable();
        readable._read = () => { };
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}

/**
 * Upload audio file directly (from file path or URL)
 * @param {string} filePath - Path to file or URL
 * @param {string} publicId - Public ID for the resource
 * @returns {Promise} Cloudinary upload result
 */
async function uploadAudioFile(filePath, publicId) {
    return cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        public_id: publicId,
        folder: 'tenteen/raw/songs'
    });
}

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} pathOrBuffer - Path, URL, or Buffer
 * @param {string} publicId - Public ID for the image
 * @param {string} folder - Folder path (e.g., 'artists', 'albums', 'covers')
 * @returns {Promise} Cloudinary upload result
 */
async function uploadImage(pathOrBuffer, publicId, folder = 'general') {
    // If buffer, convert to base64 data URI
    if (Buffer.isBuffer(pathOrBuffer)) {
        const base64 = pathOrBuffer.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;
        return cloudinary.uploader.upload(dataUri, {
            public_id: publicId,
            folder: `tenteen/image/${folder}`,
            quality: 'auto',
            format: 'webp'
        });
    }

    return cloudinary.uploader.upload(pathOrBuffer, {
        public_id: publicId,
        folder: `tenteen/image/${folder}`,
        quality: 'auto',
        format: 'webp'
    });
}

/**
 * Delete a resource from Cloudinary
 * @param {string} publicId - Public ID of the resource
 * @param {string} resourceType - 'raw' for audio, 'image' for images
 * @returns {Promise} Cloudinary destroy result
 */
async function deleteResource(publicId, resourceType = 'raw') {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Generate a signed URL for temporary access (private resources)
 * @param {string} publicId - Public ID of the resource
 * @param {string} resourceType - 'raw' or 'image'
 * @param {number} expiresInSeconds - URL validity duration
 * @returns {string} Signed URL
 */
function generateSignedUrl(publicId, resourceType = 'raw', expiresInSeconds = 3600) {
    const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

    if (resourceType === 'raw') {
        return cloudinary.url(publicId, {
            resource_type: 'raw',
            sign_url: true,
            type: 'authenticated',
            expires_at: timestamp
        });
    }

    return cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        expires_at: timestamp
    });
}

/**
 * Get resource info from Cloudinary
 * @param {string} publicId - Public ID
 * @param {string} resourceType - 'raw' or 'image'
 * @returns {Promise} Resource details
 */
async function getResourceInfo(publicId, resourceType = 'raw') {
    return cloudinary.api.resource(publicId, { resource_type: resourceType });
}

/**
 * Check if Cloudinary is properly configured
 * @returns {boolean}
 */
function isConfigured() {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

export {
    cloudinary,
    uploadAudioStream,
    uploadAudioFile,
    uploadImage,
    deleteResource,
    generateSignedUrl,
    getResourceInfo,
    isConfigured
};

export default {
    cloudinary,
    uploadAudioStream,
    uploadAudioFile,
    uploadImage,
    deleteResource,
    generateSignedUrl,
    getResourceInfo,
    isConfigured
};
