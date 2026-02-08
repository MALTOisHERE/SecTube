// API and Backend URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Extract backend URL from API URL (remove /api suffix)
export const BACKEND_URL = API_BASE_URL.replace('/api', '');

// Helper function to get full asset URL
// Handles both local paths and Cloudinary URLs
export const getAssetUrl = (path) => {
  if (!path) return `${BACKEND_URL}/avatars/default-avatar.svg`;

  // If it's already a full URL (Cloudinary or other CDN), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // For local paths, prepend backend URL
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper functions for specific asset types
export const getAvatarUrl = (avatarPath) => {
  // If it's already a full URL (from Cloudinary), return as is
  if (avatarPath && (avatarPath.startsWith('http://') || avatarPath.startsWith('https://'))) {
    return avatarPath;
  }
  return getAssetUrl(`/avatars/${avatarPath || 'default-avatar.svg'}`);
};

export const getThumbnailUrl = (thumbnailPath) => {
  // If it's already a full URL (from Cloudinary), return as is
  if (thumbnailPath && (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://'))) {
    return thumbnailPath;
  }
  return getAssetUrl(`/thumbnails/${thumbnailPath || 'default-thumbnail.jpg'}`);
};

export const getVideoUrl = (videoPath) => {
  // If it's already a full URL (from Cloudinary), return as is
  if (videoPath && (videoPath.startsWith('http://') || videoPath.startsWith('https://'))) {
    return videoPath;
  }
  return getAssetUrl(videoPath);
};
