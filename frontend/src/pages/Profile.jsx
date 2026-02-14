import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaSave, FaVideo } from 'react-icons/fa';
import ConfirmDialog from '../components/ConfirmDialog';
import { getAvatarUrl } from '../config/constants';

const specialtiesOptions = [
  'Web Application Security',
  'Network Security',
  'Bug Bounty',
  'Penetration Testing',
  'Malware Analysis',
  'Reverse Engineering',
  'Mobile Security',
  'Cloud Security',
  'CTF Challenges',
  'OSINT',
  'Cryptography',
  'IoT Security',
  'Other',
];

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    socialLinks: {
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || '',
      linkedin: user?.socialLinks?.linkedin || '',
      website: user?.socialLinks?.website || '',
      hackerone: user?.socialLinks?.hackerone || '',
      bugcrowd: user?.socialLinks?.bugcrowd || '',
    },
    specialties: user?.specialties || [],
  });
  const [upgradeData, setUpgradeData] = useState({
    channelName: '',
    specialties: [],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);

  const updateMutation = useMutation((data) => authAPI.updateProfile(data), {
    onSuccess: (response) => {
      updateUser(response.data.data);
      queryClient.invalidateQueries('me');
      addToast({ type: 'success', message: 'Profile updated successfully!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Update failed' });
    },
  });

  const upgradeMutation = useMutation((data) => authAPI.upgradeToStreamer(data), {
    onSuccess: (response) => {
      updateUser(response.data.data);
      queryClient.invalidateQueries('me');
      addToast({ type: 'success', message: 'Successfully upgraded to streamer account!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Upgrade failed' });
    },
  });

  const downgradeMutation = useMutation(() => authAPI.downgradeToViewer(), {
    onSuccess: (response) => {
      updateUser(response.data.data);
      queryClient.invalidateQueries('me');
      addToast({ type: 'success', message: 'Successfully downgraded to viewer account' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Downgrade failed' });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setFormData({
        ...formData,
        socialLinks: {
          ...formData.socialLinks,
          [socialKey]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSpecialtyToggle = (specialty) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.includes(specialty)
        ? formData.specialties.filter((s) => s !== specialty)
        : [...formData.specialties, specialty],
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create FormData to support file upload
    const data = new FormData();
    data.append('displayName', formData.displayName);
    data.append('bio', formData.bio);
    data.append('socialLinks', JSON.stringify(formData.socialLinks));
    data.append('specialties', JSON.stringify(formData.specialties));

    if (avatarFile) {
      data.append('avatar', avatarFile);
    }

    updateMutation.mutate(data);
  };

  const handleUpgradeSubmit = (e) => {
    e.preventDefault();
    upgradeMutation.mutate(upgradeData);
  };

  return (
    <div className="px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-dark-800 rounded-xl p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600/20 to-primary-500/10 rounded-xl flex items-center justify-center">
              <FaSave className="text-2xl text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-sm text-gray-400 mt-1">Manage your account information</p>
            </div>
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">Profile Picture</label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={
                      avatarPreview ||
                      getAvatarUrl(user?.avatar)
                    }
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary-600/20 shadow-lg"
                    onError={(e) => {
                      e.target.src = getAvatarUrl('default-avatar.svg');
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-primary-600/50 opacity-0 hover:opacity-100 transition"></div>
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer bg-dark-700 hover:bg-dark-600 px-5 py-2.5 rounded-lg transition inline-block text-sm font-semibold"
                  >
                    Choose Avatar
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, GIF (Max 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition resize-none text-white placeholder-gray-500"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Specialties</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specialtiesOptions.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      formData.specialties.includes(specialty)
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : 'bg-dark-700 hover:bg-dark-600'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium mb-4 text-gray-300">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">Twitter</label>
                  <input
                    type="url"
                    name="social_twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">GitHub</label>
                  <input
                    type="url"
                    name="social_github"
                    value={formData.socialLinks.github}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">LinkedIn</label>
                  <input
                    type="url"
                    name="social_linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">Website</label>
                  <input
                    type="url"
                    name="social_website"
                    value={formData.socialLinks.website}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">HackerOne</label>
                  <input
                    type="url"
                    name="social_hackerone"
                    value={formData.socialLinks.hackerone}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                    placeholder="https://hackerone.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">Bugcrowd</label>
                  <input
                    type="url"
                    name="social_bugcrowd"
                    value={formData.socialLinks.bugcrowd}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                    placeholder="https://bugcrowd.com/username"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 py-3.5 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              <FaSave />
              <span>{updateMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>

        {!user?.isStreamer ? (
          <div className="bg-dark-800 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-600/20 to-primary-500/10 rounded-xl flex items-center justify-center">
                <FaVideo className="text-2xl text-primary-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Become a Streamer</h2>
                <p className="text-sm text-gray-400 mt-1">Share your knowledge with the community</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              Upgrade your account to start uploading videos and sharing your cybersecurity expertise with thousands of enthusiasts worldwide.
            </p>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">Channel Name</label>
                <input
                  type="text"
                  value={upgradeData.channelName}
                  onChange={(e) => setUpgradeData({ ...upgradeData, channelName: e.target.value })}
                  required
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                  placeholder="Your channel name"
                />
              </div>

              <button
                type="submit"
                disabled={upgradeMutation.isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 py-3.5 rounded-lg font-semibold transition disabled:opacity-50 text-base"
              >
                {upgradeMutation.isLoading ? 'Upgrading...' : 'Upgrade to Streamer'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
              <div className="w-14 h-14 bg-gradient-to-br from-red-600/20 to-red-500/10 rounded-xl flex items-center justify-center">
                <FaVideo className="text-2xl text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Streamer Account</h2>
                <p className="text-sm text-gray-400 mt-1">Manage your content creator status</p>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-200">
                <strong>Warning:</strong> Downgrading to a viewer account will remove your ability to upload videos. Your existing videos will remain public, but you won't be able to upload new ones.
              </p>
            </div>

            <button
              onClick={() => setShowDowngradeConfirm(true)}
              disabled={downgradeMutation.isLoading}
              className="w-full bg-red-600 hover:bg-red-700 py-3.5 rounded-lg font-semibold transition disabled:opacity-50 text-base"
            >
              {downgradeMutation.isLoading ? 'Downgrading...' : 'Downgrade to Viewer'}
            </button>
          </div>
        )}

        <ConfirmDialog
          isOpen={showDowngradeConfirm}
          onClose={() => setShowDowngradeConfirm(false)}
          onConfirm={() => downgradeMutation.mutate()}
          title="Downgrade to Viewer Account"
          message="Are you sure you want to downgrade to a viewer account? You will lose access to upload new videos. Your existing videos will remain public."
          confirmText="Yes, Downgrade"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
};

export default Profile;
