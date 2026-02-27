// API and Backend URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Extract backend URL from API URL (remove /api suffix)
export const BACKEND_URL = API_BASE_URL.replace('/api', '');

const isAbsoluteUrl = (path) => path && (path.startsWith('http://') || path.startsWith('https://'));

// Helper function to get full asset URL
// Handles both local paths and Cloudinary URLs
export const getAssetUrl = (path) => {
  if (!path) return `${BACKEND_URL}/avatars/default-avatar.svg`;

  if (isAbsoluteUrl(path)) {
    return path;
  }

  // For local paths, prepend backend URL
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper functions for specific asset types
export const getAvatarUrl = (avatarPath) => {
  if (isAbsoluteUrl(avatarPath)) {
    return avatarPath;
  }
  return getAssetUrl(`/avatars/${avatarPath || 'default-avatar.svg'}`);
};

export const getThumbnailUrl = (thumbnailPath) => {
  if (isAbsoluteUrl(thumbnailPath)) {
    return thumbnailPath;
  }
  return getAssetUrl(`/thumbnails/${thumbnailPath || 'default-thumbnail.jpg'}`);
};

export const getVideoUrl = (videoPath) => {
  if (isAbsoluteUrl(videoPath)) {
    return videoPath;
  }
  return getAssetUrl(videoPath);
};
