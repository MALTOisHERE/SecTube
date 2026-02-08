import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { videoAPI } from '../services/api';
import { FaUpload, FaVideo, FaImage } from 'react-icons/fa';

const categories = [
  'Web Application Security',
  'Network Security',
  'Bug Bounty',
  'Penetration Testing',
  'Malware Analysis',
  'Reverse Engineering',
  'Mobile Security',
  'Cloud Security',
  'CTF Writeup',
  'OSINT',
  'Cryptography',
  'IoT Security',
  'Security Tools',
  'Tutorial',
  'Other',
];

const Upload = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0],
    difficulty: 'Beginner',
    tags: '',
    toolsUsed: '',
    visibility: 'public',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const uploadMutation = useMutation(
    (data) =>
      videoAPI.uploadVideo(data, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }),
    {
      onSuccess: (response) => {
        navigate(`/video/${response.data.data._id}`);
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Upload failed. Please try again.');
      },
    }
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) {
        setError('Video file must be less than 5GB');
        return;
      }
      setVideoFile(file);
      setError('');
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    const data = new FormData();
    data.append('video', videoFile);
    if (thumbnailFile) {
      data.append('thumbnail', thumbnailFile);
    }
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('difficulty', formData.difficulty);
    data.append('visibility', formData.visibility);

    if (formData.tags) {
      data.append('tags', formData.tags);
    }

    if (formData.toolsUsed) {
      data.append('toolsUsed', formData.toolsUsed);
    }

    uploadMutation.mutate(data);
  };

  return (
    <div className="px-6 py-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dark-700">
            <div className="w-12 h-12 bg-primary-600/10 border border-primary-600/20 rounded-lg flex items-center justify-center">
              <FaUpload className="text-xl text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Upload Video</h1>
              <p className="text-sm text-gray-400">Share your cybersecurity knowledge</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Video File <span className="text-red-400">*</span>
              </label>
              <div className="group border-2 border-dashed border-dark-700 bg-dark-900/50 rounded-xl p-8 text-center hover:border-primary-600 hover:bg-dark-900 transition-all">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="video-upload"
                  disabled={uploadMutation.isLoading}
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-primary-600/10 border border-primary-600/20 rounded-lg flex items-center justify-center group-hover:bg-primary-600/20 transition">
                    <FaVideo size={28} className="text-primary-600" />
                  </div>
                  <div>
                    <span className="text-base font-medium block mb-1">
                      {videoFile ? videoFile.name : 'Click to select video file'}
                    </span>
                    <span className="text-sm text-gray-400">
                      MP4, AVI, MOV, MKV, WebM (Max 5GB)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">Thumbnail (Optional)</label>
              <div className="group border-2 border-dashed border-dark-700 bg-dark-900/50 rounded-xl p-6 text-center hover:border-primary-600 hover:bg-dark-900 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                  disabled={uploadMutation.isLoading}
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-primary-600/10 border border-primary-600/20 rounded-lg flex items-center justify-center group-hover:bg-primary-600/20 transition">
                    <FaImage size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <span className="text-sm block mb-1">
                      {thumbnailFile ? thumbnailFile.name : 'Click to select thumbnail'}
                    </span>
                    <span className="text-xs text-gray-400">JPG, PNG, GIF (Recommended: 1280x720)</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                placeholder="e.g., SQL Injection Tutorial for Beginners"
                disabled={uploadMutation.isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                maxLength={5000}
                rows={6}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition resize-none text-white placeholder-gray-500"
                placeholder="Describe your video, what viewers will learn, and any prerequisites..."
                disabled={uploadMutation.isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white"
                  disabled={uploadMutation.isLoading}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">Difficulty Level</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white"
                  disabled={uploadMutation.isLoading}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                placeholder="e.g., sql, web, security, tutorial"
                disabled={uploadMutation.isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Tools Used (comma separated)
              </label>
              <input
                type="text"
                name="toolsUsed"
                value={formData.toolsUsed}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                placeholder="e.g., Burp Suite, sqlmap, Kali Linux"
                disabled={uploadMutation.isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">Visibility</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white"
                disabled={uploadMutation.isLoading}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>

            {uploadMutation.isLoading && (
              <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Uploading...</span>
                  <span className="text-sm font-medium text-primary-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-600 to-primary-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse"></span>
                  Please don't close this page. Your video will be processed after upload.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploadMutation.isLoading || !videoFile}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
            >
              <FaUpload />
              <span>{uploadMutation.isLoading ? 'Uploading...' : 'Upload Video'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
