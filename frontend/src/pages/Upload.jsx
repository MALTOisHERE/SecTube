import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { videoAPI } from '../services/api';
import useToastStore from '../store/toastStore';
import { FaUpload, FaVideo, FaImage, FaList, FaTags, FaTools, FaEye, FaFileUpload } from 'react-icons/fa';
import PageHeader from '../components/PageHeader';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import CustomSelect from '../components/CustomSelect';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';

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
      if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB limit based on .env
        addToast({ type: 'error', message: 'Video file too large (Max 5GB)' });
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
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* Left Side: Navigation */}
        <aside className="lg:w-[280px] flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-500 border border-primary-500/20 mb-4 shadow-lg">
                <FaFileUpload size={28} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Studio Upload</h2>
              <p className="text-sm text-gray-500 italic mt-1">Ready to share?</p>
            </div>

            <nav className="space-y-1">
              <a href="#files" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-900 transition text-sm font-medium">
                <FaVideo size={14} className="text-primary-500" /> Files
              </a>
              <a href="#details" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-900 transition text-sm font-medium">
                <FaList size={14} /> Metadata
              </a>
              <a href="#options" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-900 transition text-sm font-medium">
                <FaEye size={14} /> Visibility
              </a>
            </nav>
          </div>
        </aside>

        {/* Right Side: Content */}
        <main className="flex-1 space-y-12">
          
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* File Selection */}
            <div id="files" className="scroll-mt-24">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Upload Assets</h3>
                <p className="text-sm text-gray-500">Select your video file and an optional thumbnail.</p>
              </div>

              <div className="space-y-6">
                <FileUpload
                  label="Video File"
                  required
                  accept="video/*"
                  onChange={handleVideoChange}
                  icon={FaVideo}
                  fileName={videoFile?.name}
                  helpText="MP4, MOV, MKV (Recommended: H.264)"
                  disabled={uploadMutation.isLoading}
                />

                <FileUpload
                  label="Custom Thumbnail (Optional)"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  icon={FaImage}
                  fileName={thumbnailFile?.name}
                  helpText="1280x720 (16:9 aspect ratio). JPG or PNG."
                  disabled={uploadMutation.isLoading}
                  variant="compact"
                />
              </div>
            </div>

            {/* Video Details */}
            <div id="details" className="scroll-mt-24">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Metadata</h3>
                <p className="text-sm text-gray-500">Describe your content for better discoverability.</p>
              </div>

              <div className="space-y-6">
                <Input
                  label="Video Title"
                  required
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g., Identifying SQL Injection in Node.js Apps"
                  disabled={uploadMutation.isLoading}
                  className="bg-dark-950 border-dark-800"
                />
                
                <Textarea
                  label="Comprehensive Description"
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={5000}
                  rows={6}
                  placeholder="What will viewers learn from this technical deep-dive?"
                  disabled={uploadMutation.isLoading}
                  showCount
                  className="bg-dark-950 border-dark-800"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <CustomSelect
                    label="Category"
                    options={categories}
                    value={formData.category}
                    onChange={(val) => setFormData({...formData, category: val})}
                    icon={FaList}
                  />

                  <CustomSelect
                    label="Difficulty Level"
                    options={difficultyLevels}
                    value={formData.difficulty}
                    onChange={(val) => setFormData({...formData, difficulty: val})}
                    icon={FaTools}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Search Tags"
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="sql, injection, nodejs, websec"
                    helpText="Comma separated"
                    disabled={uploadMutation.isLoading}
                    icon={FaTags}
                    className="bg-dark-950 border-dark-800"
                  />

                  <Input
                    label="Tools Demonstrated"
                    type="text"
                    name="toolsUsed"
                    value={formData.toolsUsed}
                    onChange={handleChange}
                    placeholder="Burp Suite, SQLMap, Wireshark"
                    helpText="Comma separated"
                    disabled={uploadMutation.isLoading}
                    icon={FaTools}
                    className="bg-dark-950 border-dark-800"
                  />
                </div>
              </div>
            </div>

            {/* Visibility Options */}
            <div id="options" className="scroll-mt-24">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Publishing Settings</h3>
                <p className="text-sm text-gray-500">Control who can access your research.</p>
              </div>

              <div className="max-w-md">
                <CustomSelect
                  label="Visibility"
                  options={visibilityOptions}
                  value={formData.visibility}
                  onChange={(val) => setFormData({...formData, visibility: val})}
                  icon={FaEye}
                />
              </div>
            </div>

            {/* Progress and Actions */}
            <div className="pt-8 border-t border-dark-800 space-y-6">
              {uploadMutation.isLoading && (
                <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-white uppercase tracking-widest">Uploading Byte Stream...</span>
                    <span className="text-lg font-black text-primary-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-dark-950 rounded-full h-2 overflow-hidden border border-dark-800">
                    <div
                      className="bg-primary-600 h-full transition-all duration-300 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-[0.2em] animate-pulse">
                    Transmission in progress. Do not disconnect.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={uploadMutation.isLoading || !videoFile}
                  loading={uploadMutation.isLoading}
                  icon={FaUpload}
                  className="px-12 py-4 text-base font-bold shadow-xl shadow-primary-900/20"
                >
                  {uploadMutation.isLoading ? 'Processing...' : 'Deploy Content'}
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Upload;
