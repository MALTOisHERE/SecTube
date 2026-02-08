import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import fs from 'fs';

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} Upload result with url and public_id
 */
export const uploadImageToCloudinary = async (filePath, folder = 'sectube') => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    // Delete local file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Upload video to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} Upload result with url and public_id
 */
export const uploadVideoToCloudinary = async (filePath, folder = 'sectube/videos') => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'video',
      chunk_size: 6000000, // 6MB chunks for large files
      eager: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto', format: 'mp4' },
        { width: 1280, height: 720, crop: 'limit', quality: 'auto', format: 'mp4' },
        { width: 854, height: 480, crop: 'limit', quality: 'auto', format: 'mp4' },
        { width: 640, height: 360, crop: 'limit', quality: 'auto', format: 'mp4' }
      ],
      eager_async: true, // Process transformations in background
    });

    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format
    };
  } catch (error) {
    // Delete local file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Type of resource ('image' or 'video')
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured()) {
    return; // Silently fail if not configured
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

/**
 * Get Cloudinary URL for different qualities
 * @param {string} publicId - Cloudinary public ID
 * @param {string} quality - Quality (360p, 480p, 720p, 1080p, original)
 * @returns {string} Cloudinary URL
 */
export const getCloudinaryVideoUrl = (publicId, quality = 'original') => {
  if (!publicId) return null;

  const qualityMap = {
    '360p': { width: 640, height: 360 },
    '480p': { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 }
  };

  if (quality === 'original') {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      secure: true,
      format: 'mp4' // Explicitly specify MP4 format
    });
  }

  const dimensions = qualityMap[quality];
  if (!dimensions) return null;

  return cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: [
      { width: dimensions.width, height: dimensions.height, crop: 'limit', quality: 'auto', format: 'mp4' }
    ],
    secure: true,
    format: 'mp4' // Explicitly specify MP4 format
  });
};
