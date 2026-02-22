import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaSave, FaVideo, FaUser, FaTwitter, FaGithub, FaLinkedin, FaGlobe, FaBug, FaFingerprint, FaLink, FaUserEdit, FaCheck, FaShieldAlt, FaDiscord, FaYoutube } from 'react-icons/fa';
import { SiTryhackme } from 'react-icons/si';
import ConfirmDialog from '../components/ConfirmDialog';
import { getAvatarUrl } from '../config/constants';
import PageHeader from '../components/PageHeader';
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
  'Digital Forensics',
  'Incident Response',
  'Threat Hunting',
  'DevSecOps',
  'Application Security',
  'SCADA / ICS Security',
  'Wireless Security',
  'Social Engineering',
  'Red Teaming',
  'Blue Teaming',
  'API Security',
  'Binary Exploitation',
  'Kernel Hacking',
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
      discord: user?.socialLinks?.discord || '',
      youtube: user?.socialLinks?.youtube || '',
      tryhackme: user?.socialLinks?.tryhackme || '',
    },
    specialties: user?.specialties || [],
  });

  const [upgradeData, setUpgradeData] = useState({
    channelName: user?.channelName || '',
    specialties: user?.specialties || [],
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);

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
      setShowUpgradeConfirm(false);
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Upgrade failed' });
    },
  });

  const downgradeMutation = useMutation(() => authAPI.downgradeToViewer(), {
    onSuccess: (response) => {
      updateUser(response.data.data);
      queryClient.invalidateQueries('me');
      addToast({ type: 'info', message: 'Successfully downgraded to viewer account' });
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
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('displayName', formData.displayName);
    data.append('bio', formData.bio);
    data.append('socialLinks', JSON.stringify(formData.socialLinks));
    data.append('specialties', JSON.stringify(formData.specialties));
    if (avatarFile) data.append('avatar', avatarFile);
    updateMutation.mutate(data);
  };

  const handleUpgradeSubmit = (e) => {
    if (e) e.preventDefault();
    if (!upgradeData.channelName.trim()) {
      return addToast({ type: 'error', message: 'Please enter a channel name' });
    }
    
    // If they already have a name, just reactivate without the warning
    if (user?.channelName) {
      upgradeMutation.mutate(upgradeData);
    } else {
      setShowUpgradeConfirm(true);
    }
  };

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* Left Side: Navigation */}
        <aside className="lg:w-[280px] flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="flex flex-col items-center text-center px-4">
              <div className="relative mb-4 group">
                <img 
                  src={avatarPreview || getAvatarUrl(user?.avatar)} 
                  alt={user?.username} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-dark-800 transition-colors group-hover:border-primary-500"
                />
              </div>
              <h2 className="text-lg font-bold text-white">{user?.displayName || user?.username}</h2>
              <p className="text-sm text-gray-500 italic mt-1">@{user?.username}</p>
            </div>

            <nav className="space-y-1">
              <a href="#identity" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-900 transition text-sm font-medium">
                <FaUser size={14} /> Identity
              </a>
              <a href="#expertise" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-900 transition text-sm font-medium">
                <FaBug size={14} /> Expertise
              </a>
              <a href="#social" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-900 transition text-sm font-medium">
                <FaLink size={14} /> Social Links
              </a>
              <a href="#streamer" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-900 transition text-sm font-medium border-t border-dark-800 mt-2 pt-4">
                <FaVideo size={14} /> Creator Settings
              </a>
            </nav>
          </div>
        </aside>

        {/* Right Side: Content */}
        <main className="flex-1 space-y-12">
          
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Identity */}
            <div id="identity" className="scroll-mt-24">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Public Identity</h3>
                <p className="text-sm text-gray-500">Manage how you appear to the community.</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-8 py-6 px-8 bg-dark-900 border border-dark-800 rounded-md">
                  <FileUpload
                    onChange={handleAvatarChange}
                    previewUrl={avatarPreview || getAvatarUrl(user?.avatar)}
                    variant="avatar"
                  />
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold text-gray-200">Change Profile Picture</h4>
                    <p className="text-xs text-gray-500 mt-1">Recommended size: 400x400px</p>
                  </div>
                </div>

                <Input
                  label="Display Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Your public alias"
                  icon={FaUserEdit}
                />
                
                <Textarea
                  label="Bio / Research Focus"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Share a brief intro about your expertise..."
                  maxLength={500}
                  showCount
                />
              </div>
            </div>

            {/* Expertise */}
            <div id="expertise" className="scroll-mt-24">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Expertise</h3>
                <p className="text-sm text-gray-500">Tag your skills to personalize your experience.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {specialtiesOptions.map((opt) => {
                  const isActive = formData.specialties.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSpecialtyToggle(opt)}
                      className={`px-4 py-2 rounded-md text-xs font-medium transition border ${
                        isActive
                          ? 'bg-primary-600 border-primary-500 text-white'
                          : 'bg-dark-900 border-dark-800 text-gray-400 hover:border-dark-700'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Socials */}
            <div id="social" className="scroll-mt-24">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Social Links</h3>
                <p className="text-sm text-gray-500">Connect with the community across other platforms.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Twitter" name="social_twitter" value={formData.socialLinks.twitter} onChange={handleChange} icon={FaTwitter} placeholder="https://twitter.com/username" />
                <Input label="GitHub" name="social_github" value={formData.socialLinks.github} onChange={handleChange} icon={FaGithub} placeholder="https://github.com/username" />
                <Input label="LinkedIn" name="social_linkedin" value={formData.socialLinks.linkedin} onChange={handleChange} icon={FaLinkedin} placeholder="https://linkedin.com/in/username" />
                <Input label="Discord" name="social_discord" value={formData.socialLinks.discord} onChange={handleChange} icon={FaDiscord} placeholder="Username or Server invite" />
                <Input label="YouTube" name="social_youtube" value={formData.socialLinks.youtube} onChange={handleChange} icon={FaYoutube} placeholder="https://youtube.com/@channel" />
                <Input label="TryHackMe" name="social_tryhackme" value={formData.socialLinks.tryhackme} onChange={handleChange} icon={SiTryhackme} placeholder="Username" />
                <Input label="HackerOne" name="social_hackerone" value={formData.socialLinks.hackerone} onChange={handleChange} icon={FaBug} placeholder="Username" />
                <Input label="Bugcrowd" name="social_bugcrowd" value={formData.socialLinks.bugcrowd} onChange={handleChange} icon={FaBug} placeholder="Username" />
                <Input label="Website" name="social_website" value={formData.socialLinks.website} onChange={handleChange} icon={FaGlobe} placeholder="https://yourwebsite.com" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                loading={updateMutation.isLoading}
                icon={FaSave}
                className="px-10"
              >
                Save Profile
              </Button>
            </div>
          </form>

          {/* Streamer Controls */}
          <div id="streamer" className="scroll-mt-24 pt-6">
            {!user?.isStreamer ? (
              <div className="bg-dark-900 border border-dark-800 rounded-md p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-white">Unlock Streamer Status</h3>
                    <p className="text-sm text-gray-500">
                      {user?.channelName 
                        ? `Welcome back! Re-activate your channel "${user.channelName}".` 
                        : "Create your channel to start uploading and sharing cybersecurity content."}
                    </p>
                  </div>
                  <form onSubmit={handleUpgradeSubmit} className="flex flex-col gap-3 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Channel Name"
                      maxLength={30}
                      className="w-full md:w-[450px] bg-dark-950 border border-dark-700 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
                      value={upgradeData.channelName}
                      onChange={(e) => setUpgradeData({...upgradeData, channelName: e.target.value})}
                      disabled={!!user?.channelName}
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        {user?.channelName ? "Permanent Alias" : "Max 30 characters"}
                      </span>
                      <span className={`text-[10px] font-bold ${upgradeData.channelName.length >= 30 ? 'text-red-500' : 'text-gray-500'}`}>
                        {upgradeData.channelName.length}/30
                      </span>
                    </div>
                    <Button
                      type="submit"
                      loading={upgradeMutation.isLoading}
                      fullWidth
                    >
                      Activate Channel
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-dark-900 border border-dark-800 rounded-md p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-600/10 rounded-full text-primary-500">
                    <FaShieldAlt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Streamer Status Active</h3>
                    <p className="text-sm text-gray-500">Channel: {user.channelName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDowngradeConfirm(true)}
                  className="px-5 py-2.5 rounded-md bg-dark-800 border border-dark-700 text-sm font-bold text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-sm"
                >
                  Deactivate Channel
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={showUpgradeConfirm}
        onClose={() => setShowUpgradeConfirm(false)}
        onConfirm={() => upgradeMutation.mutate(upgradeData)}
        title="Activate Streamer Channel"
        message={`Warning: The channel name "${upgradeData.channelName}" will be permanently linked to your account. This name cannot be changed later, even if you deactivate your channel. Do you want to proceed?`}
        confirmText="Activate Channel"
        type="info"
      />

      <ConfirmDialog
        isOpen={showDowngradeConfirm}
        onClose={() => setShowDowngradeConfirm(false)}
        onConfirm={() => downgradeMutation.mutate()}
        title="Confirm Deactivation"
        message={`Are you sure? Your channel name "${user?.channelName}" will remain reserved for you, but you will lose streaming privileges.`}
        confirmText="Confirm"
      />
    </div>
  );
};

export default Profile;
