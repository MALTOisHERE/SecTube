import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { videoAPI } from '../services/api';
import useToastStore from '../store/toastStore';
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
  const { addToast } = useToastStore();
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

  const uploadMutation = useMutation(
    (data) =>
      videoAPI.uploadVideo(data, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }),
    {
      onSuccess: (response) => {
        addToast({ type: 'success', message: 'Video uploaded successfully! Processing started.' });
        navigate(`/video/${response.data.data._id}`);
      },
      onError: (err) => {
        addToast({ type: 'error', message: err.response?.data?.message || 'Upload failed. Please try again.' });
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
        addToast({ type: 'error', message: 'Video file must be less than 5GB' });
        return;
      }
      setVideoFile(file);
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
      addToast({ type: 'warning', message: 'Please select a video file' });
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
    <div className="px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-dark-800 rounded-xl p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600/20 to-primary-500/10 rounded-xl flex items-center justify-center">
              <FaUpload className="text-2xl text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Upload Video</h1>
              <p className="text-sm text-gray-400 mt-1">Share your cybersecurity knowledge with the community</p>
            </div>
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Video File <span className="text-red-400">*</span>
              </label>
              <div className="group border-2 border-dashed border-gray-700 bg-dark-900/50 rounded-xl p-8 text-center hover:border-primary-500 hover:bg-dark-900 transition-all cursor-pointer">
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
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-600/20 to-primary-500/10 rounded-xl flex items-center justify-center group-hover:from-primary-600/30 group-hover:to-primary-500/20 transition">
                    <FaVideo size={32} className="text-primary-500" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold block mb-1">
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
              <div className="group border-2 border-dashed border-gray-700 bg-dark-900/50 rounded-xl p-6 text-center hover:border-primary-500 hover:bg-dark-900 transition-all cursor-pointer">
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
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600/20 to-primary-500/10 rounded-xl flex items-center justify-center group-hover:from-primary-600/30 group-hover:to-primary-500/20 transition">
                    <FaImage size={24} className="text-primary-500" />
                  </div>
                  <div>
                    <span className="text-base font-semibold block mb-1">
                      {thumbnailFile ? thumbnailFile.name : 'Click to select thumbnail'}
                    </span>
                    <span className="text-sm text-gray-400">JPG, PNG, GIF (Recommended: 1280x720)</span>
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
              <div className="bg-primary-600/10 border border-primary-600/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-semibold">Uploading your video...</span>
                  <span className="text-base font-bold text-primary-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-300 mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                  Please don't close this page. Your video will be processed after upload.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploadMutation.isLoading || !videoFile}
              className="w-full bg-primary-600 hover:bg-primary-700 py-3.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
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
