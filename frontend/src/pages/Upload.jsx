import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { videoAPI } from '../services/api';
import useToastStore from '../store/toastStore';
import { FaUpload, FaVideo, FaImage } from 'react-icons/fa';
import PageHeader from '../components/PageHeader';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';
import Card from '../components/Card';

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

const difficultyLevels = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' },
];

const visibilityOptions = [
  { value: 'public', label: 'Public - Anyone can watch' },
  { value: 'unlisted', label: 'Unlisted - Only with link' },
  { value: 'private', label: 'Private - Only you' },
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
        <Card>
          <PageHeader
            icon={FaUpload}
            title="Upload Video"
            subtitle="Share your cybersecurity knowledge with the community"
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video File Upload */}
            <FileUpload
              label="Video File"
              required
              accept="video/*"
              onChange={handleVideoChange}
              icon={FaVideo}
              fileName={videoFile?.name}
              helpText="MP4, AVI, MOV, MKV, WebM (Max 5GB)"
              disabled={uploadMutation.isLoading}
            />

            {/* Thumbnail Upload */}
            <FileUpload
              label="Thumbnail (Optional)"
              accept="image/*"
              onChange={handleThumbnailChange}
              icon={FaImage}
              fileName={thumbnailFile?.name}
              helpText="JPG, PNG, GIF (Recommended: 1280x720)"
              disabled={uploadMutation.isLoading}
              variant="compact"
            />

            {/* Title */}
            <Input
              label="Title"
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={100}
              placeholder="e.g., SQL Injection Tutorial for Beginners"
              disabled={uploadMutation.isLoading}
            />

            {/* Description */}
            <Textarea
              label="Description"
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={5000}
              rows={6}
              placeholder="Describe your video, what viewers will learn, and any prerequisites..."
              disabled={uploadMutation.isLoading}
              showCount
            />

            {/* Category and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Category"
                required
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={categories}
                disabled={uploadMutation.isLoading}
              />

              <Select
                label="Difficulty Level"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                options={difficultyLevels}
                disabled={uploadMutation.isLoading}
              />
            </div>

            {/* Tags */}
            <Input
              label="Tags"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., sql, web, security, tutorial"
              helpText="Comma separated tags for better discoverability"
              disabled={uploadMutation.isLoading}
            />

            {/* Tools Used */}
            <Input
              label="Tools Used"
              type="text"
              name="toolsUsed"
              value={formData.toolsUsed}
              onChange={handleChange}
              placeholder="e.g., Burp Suite, sqlmap, Kali Linux"
              helpText="Comma separated list of tools demonstrated in the video"
              disabled={uploadMutation.isLoading}
            />

            {/* Visibility */}
            <Select
              label="Visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              options={visibilityOptions}
              disabled={uploadMutation.isLoading}
            />

            {/* Upload Progress */}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={uploadMutation.isLoading || !videoFile}
              loading={uploadMutation.isLoading}
              icon={FaUpload}
              fullWidth
              size="lg"
            >
              {uploadMutation.isLoading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
