import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => {
    // Check if data is FormData (for avatar upload) or regular object
    const headers = data instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : {};
    return api.put('/auth/profile', data, { headers });
  },
  upgradeToStreamer: (data) => api.post('/auth/upgrade-to-streamer', data),
  downgradeToViewer: () => api.post('/auth/downgrade-to-viewer'),
};

// Video API
export const videoAPI = {
  getVideos: (params) => api.get('/videos', { params }),
  getVideo: (id) => api.get(`/videos/${id}`),
  uploadVideo: (formData, onUploadProgress) =>
    api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  updateVideo: (id, data) => api.put(`/videos/${id}`, data),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  likeVideo: (id) => api.post(`/videos/${id}/like`),
  dislikeVideo: (id) => api.post(`/videos/${id}/dislike`),
  addComment: (id, data) => api.post(`/videos/${id}/comments`, data),
  getComments: (id, params) => api.get(`/videos/${id}/comments`, { params }),
  getCommentReplies: (commentId) => api.get(`/videos/comments/${commentId}/replies`),
  likeComment: (commentId) => api.post(`/videos/comments/${commentId}/like`),
  searchVideos: (params) => api.get('/videos/search', { params }),
};

// User API
export const userAPI = {
  getUser: (username) => api.get(`/users/${username}`),
  getUserVideos: (username, params) => api.get(`/users/${username}/videos`, { params }),
  subscribe: (userId) => api.post(`/users/${userId}/subscribe`),
  unsubscribe: (userId) => api.delete(`/users/${userId}/unsubscribe`),
  getSubscriptions: () => api.get('/users/me/subscriptions'),
};

// Channel API
export const channelAPI = {
  getChannels: (params) => api.get('/channels', { params }),
  getChannel: (username) => api.get(`/channels/${username}`),
  getFeaturedChannels: (params) => api.get('/channels/featured', { params }),
};

export default api;
