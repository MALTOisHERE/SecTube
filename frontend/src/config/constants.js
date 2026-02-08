// API and Backend URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Extract backend URL from API URL (remove /api suffix)
export const BACKEND_URL = API_BASE_URL.replace('/api', '');

// Helper function to get full asset URL
export const getAssetUrl = (path) => {
  if (!path) return `${BACKEND_URL}/avatars/default-avatar.svg`;
  if (path.startsWith('http')) return path; // Already a full URL
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper functions for specific asset types
export const getAvatarUrl = (avatarPath) => {
  return getAssetUrl(`/avatars/${avatarPath || 'default-avatar.svg'}`);
};

export const getThumbnailUrl = (thumbnailPath) => {
  return getAssetUrl(`/thumbnails/${thumbnailPath || 'default-thumbnail.jpg'}`);
};

export const getVideoUrl = (videoPath) => {
  return getAssetUrl(videoPath);
};
