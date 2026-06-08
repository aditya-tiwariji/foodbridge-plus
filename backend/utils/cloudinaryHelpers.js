import cloudinary from '../config/cloudinary.js';

/**
 * Uploads a memory buffer to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Target folder on Cloudinary
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadBufferToCloudinary = (buffer, folder = 'foodbridge') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Deletes an asset from Cloudinary using its public ID
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Error deleting asset ${publicId} from Cloudinary:`, error);
    throw error;
  }
};

/**
 * Extracts Cloudinary public ID from a secure URL
 * Example: https://res.cloudinary.com/cloud/image/upload/v1234/folder/file.jpg -> folder/file
 * @param {string} url - Secure URL string
 * @returns {string|null} Public ID or null if parsing fails
 */
export const extractPublicId = (url) => {
  try {
    if (!url || !url.includes('upload/')) return null;
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Combine all segments after upload/<version>/ to extract the path and filename
    // segments will be like: ['v12345678', 'foodbridge', 'filename.jpg']
    const segments = parts.slice(uploadIndex + 1);
    
    // If the first segment is the version (starts with 'v'), skip it
    if (segments[0].startsWith('v')) {
      segments.shift();
    }
    
    const pathWithFilename = segments.join('/');
    const publicId = pathWithFilename.substring(0, pathWithFilename.lastIndexOf('.'));
    return publicId;
  } catch (error) {
    console.error('Failed to extract Cloudinary public ID:', error);
    return null;
  }
};
