import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaSave, FaVideo, FaUser, FaTwitter, FaGithub, FaLinkedin, FaGlobe, FaBug } from 'react-icons/fa';
import ConfirmDialog from '../components/ConfirmDialog';
import { getAvatarUrl } from '../config/constants';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';

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
        <Card>
          <PageHeader
            icon={FaSave}
            title="Profile Settings"
            subtitle="Manage your account information"
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <FileUpload
              label="Profile Picture"
              accept="image/*"
              onChange={handleAvatarChange}
              previewUrl={
                avatarPreview ||
                getAvatarUrl(user?.avatar)
              }
              helpText="JPG, PNG, GIF (Max 5MB)"
              variant="avatar"
            />

            {/* Display Name */}
            <Input
              label="Display Name"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              icon={FaUser}
              placeholder="Your display name"
            />

            {/* Bio */}
            <Textarea
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              placeholder="Tell us about yourself..."
              showCount
            />

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Specialties
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specialtiesOptions.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition border ${
                      formData.specialties.includes(specialty)
                        ? 'bg-primary-600 hover:bg-primary-700 text-white border-primary-700'
                        : 'bg-dark-900 hover:bg-dark-800 text-gray-300 border-dark-700'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-base font-semibold mb-3 text-gray-200">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Twitter"
                  type="url"
                  name="social_twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  icon={FaTwitter}
                  placeholder="https://twitter.com/username"
                />

                <Input
                  label="GitHub"
                  type="url"
                  name="social_github"
                  value={formData.socialLinks.github}
                  onChange={handleChange}
                  icon={FaGithub}
                  placeholder="https://github.com/username"
                />

                <Input
                  label="LinkedIn"
                  type="url"
                  name="social_linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleChange}
                  icon={FaLinkedin}
                  placeholder="https://linkedin.com/in/username"
                />

                <Input
                  label="Website"
                  type="url"
                  name="social_website"
                  value={formData.socialLinks.website}
                  onChange={handleChange}
                  icon={FaGlobe}
                  placeholder="https://yourwebsite.com"
                />

                <Input
                  label="HackerOne"
                  type="url"
                  name="social_hackerone"
                  value={formData.socialLinks.hackerone}
                  onChange={handleChange}
                  icon={FaBug}
                  placeholder="https://hackerone.com/username"
                />

                <Input
                  label="Bugcrowd"
                  type="url"
                  name="social_bugcrowd"
                  value={formData.socialLinks.bugcrowd}
                  onChange={handleChange}
                  icon={FaBug}
                  placeholder="https://bugcrowd.com/username"
                />
              </div>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={updateMutation.isLoading}
              loading={updateMutation.isLoading}
              icon={FaSave}
              fullWidth
              size="lg"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>

        {/* Upgrade/Downgrade Section */}
        {!user?.isStreamer ? (
          <Card>
            <PageHeader
              icon={FaVideo}
              title="Become a Streamer"
              subtitle="Share your knowledge with the community"
            />

            <p className="text-gray-300 mb-6">
              Upgrade your account to start uploading videos and sharing your cybersecurity expertise with thousands of enthusiasts worldwide.
            </p>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <Input
                label="Channel Name"
                required
                type="text"
                value={upgradeData.channelName}
                onChange={(e) => setUpgradeData({ ...upgradeData, channelName: e.target.value })}
                placeholder="Your channel name"
              />

              <Button
                type="submit"
                disabled={upgradeMutation.isLoading}
                loading={upgradeMutation.isLoading}
                icon={FaVideo}
                fullWidth
                size="lg"
              >
                {upgradeMutation.isLoading ? 'Upgrading...' : 'Upgrade to Streamer'}
              </Button>
            </form>
          </Card>
        ) : (
          <Card>
            <PageHeader
              icon={FaVideo}
              title="Streamer Account"
              subtitle="Manage your content creator status"
              variant="danger"
            />

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-200">
                <strong>Warning:</strong> Downgrading to a viewer account will remove your ability to upload videos. Your existing videos will remain public, but you won't be able to upload new ones.
              </p>
            </div>

            <Button
              onClick={() => setShowDowngradeConfirm(true)}
              disabled={downgradeMutation.isLoading}
              loading={downgradeMutation.isLoading}
              variant="danger"
              fullWidth
              size="lg"
            >
              {downgradeMutation.isLoading ? 'Downgrading...' : 'Downgrade to Viewer'}
            </Button>
          </Card>
        )}

        {/* Downgrade Confirmation Dialog */}
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
