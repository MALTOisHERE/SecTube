import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deleteFromCloudinary } from './cloudinaryUpload.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const videoDir = path.join(__dirname, '../../videos');
const thumbnailDir = path.join(__dirname, '../../thumbnails');
const avatarDir = path.join(__dirname, '../../avatars');

/**
 * Delete a user's avatar
 * @param {Object} user User document
 */
export const deleteUserAvatar = async (user) => {
  if (!user || !user.avatar || user.avatar === 'default-avatar.png') return;

  if (isCloudinaryConfigured() && user.avatarPublicId) {
    try {
      await deleteFromCloudinary(user.avatarPublicId, 'image');
    } catch (err) {
      console.error(`Failed to delete avatar from Cloudinary for user ${user._id}:`, err);
    }
  } else {
    // Local deletion
    try {
      // Basic protection against directory traversal
      const filename = path.basename(user.avatar);
      const filepath = path.join(avatarDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (err) {
      console.error(`Failed to delete local avatar for user ${user._id}:`, err);
    }
  }
};

/**
 * Delete a video and its associated thumbnail
 * @param {Object} video Video document
 */
export const deleteVideoFiles = async (video) => {
  if (!video) return;

  // Delete Thumbnail
  if (video.thumbnail && video.thumbnail !== 'default-thumbnail.jpg') {
    if (isCloudinaryConfigured() && video.thumbnailPublicId) {
      try {
        await deleteFromCloudinary(video.thumbnailPublicId, 'image');
      } catch (err) {
        console.error(`Failed to delete thumbnail from Cloudinary for video ${video._id}:`, err);
      }
    } else {
      // Local thumbnail deletion
      try {
        const filename = path.basename(video.thumbnail);
        const filepath = path.join(thumbnailDir, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (err) {
        console.error(`Failed to delete local thumbnail for video ${video._id}:`, err);
      }
    }
  }

  // Delete Video Files
  if (video.videoFile) {
    if (isCloudinaryConfigured() && video.videoFile.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(video.videoFile.cloudinaryPublicId, 'video');
      } catch (err) {
        console.error(`Failed to delete video from Cloudinary for video ${video._id}:`, err);
      }
    } else if (video.videoFile.processedPaths) {
      // Local video deletion (multiple qualities)
      try {
        Object.values(video.videoFile.processedPaths).forEach(videoPath => {
          if (!videoPath) return;
          const filename = path.basename(videoPath);
          const filepath = path.join(videoDir, filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        });
      } catch (err) {
        console.error(`Failed to delete local video files for video ${video._id}:`, err);
      }
    }
  }
};
