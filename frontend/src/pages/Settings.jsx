import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, videoAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaSave, FaVideo, FaUser, FaTwitter, FaGithub, FaLinkedin, FaGlobe, FaBug, FaFingerprint, FaLink, FaUserEdit, FaCheck, FaShieldAlt, FaDiscord, FaYoutube, FaUpload, FaImage, FaList, FaTags, FaTools, FaEye, FaFileUpload, FaMobileAlt, FaKey, FaChevronRight, FaTimes } from 'react-icons/fa';
import { SiTryhackme } from 'react-icons/si';
import ConfirmDialog from '../components/ConfirmDialog';
import { getAvatarUrl } from '../config/constants';
import PageHeader from '../components/PageHeader';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';

const specialtiesOptions = [
  'Web Application Security', 'Network Security', 'Bug Bounty', 'Penetration Testing', 'Malware Analysis',
  'Reverse Engineering', 'Mobile Security', 'Cloud Security', 'CTF Challenges', 'OSINT', 'Cryptography',
  'IoT Security', 'Digital Forensics', 'Incident Response', 'Threat Hunting', 'DevSecOps', 'Application Security',
  'SCADA / ICS Security', 'Wireless Security', 'Social Engineering', 'Red Teaming', 'Blue Teaming',
  'API Security', 'Binary Exploitation', 'Kernel Hacking', 'Other',
];

const categories = [
  'Web Application Security', 'Network Security', 'Bug Bounty', 'Penetration Testing', 'Malware Analysis',
  'Reverse Engineering', 'Mobile Security', 'Cloud Security', 'CTF Writeup', 'OSINT', 'Cryptography',
  'IoT Security', 'Security Tools', 'Tutorial', 'Other',
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

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  const [activeSection, setActiveSection] = useState('identity');

  // Track scroll position to update active sidebar link
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { threshold: 0.3, rootMargin: "-100px 0px -50% 0px" });

    const sections = ['identity', 'expertise', 'social', 'security', 'upload', 'streamer'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [user?.isStreamer]);

  // Profile State
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

  // Upload State
  const [uploadData, setUploadData] = useState({
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

  const [upgradeData, setUpgradeData] = useState({
    channelName: user?.channelName || '',
    specialties: user?.specialties || [],
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [show2FADisableConfirm, setShow2FADisableConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [isQRZoomed, setIsQRZoomed] = useState(false);

  // Mutations
  const setup2FAMutation = useMutation(() => authAPI.setup2FA(), {
    onSuccess: (res) => {
      setQrCode(res.data.data.qrCode);
      setShow2FASetup(true);
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to initialize 2FA' });
    }
  });

  const verify2FAMutation = useMutation((token) => authAPI.verify2FA({ token }), {
    onSuccess: () => {
      queryClient.invalidateQueries('me');
      updateUser({ ...user, isTwoFactorEnabled: true });
      setShow2FASetup(false);
      setTwoFactorToken('');
      addToast({ type: 'success', message: '2FA enabled successfully!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Invalid code' });
    }
  });

  const disable2FAMutation = useMutation((password) => authAPI.disable2FA({ password }), {
    onSuccess: () => {
      queryClient.invalidateQueries('me');
      updateUser({ ...user, isTwoFactorEnabled: false });
      setShow2FADisableConfirm(false);
      setConfirmPassword('');
      addToast({ type: 'info', message: '2FA disabled successfully' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Verification failed' });
    }
  });

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

  const uploadMutation = useMutation(
    (data) =>
      videoAPI.uploadVideo(data, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }),
    {
      onSuccess: (response) => {
        addToast({ type: 'success', message: 'Video deployed! Analysis starting...' });
        navigate(`/video/${response.data.data._id}`);
      },
      onError: (err) => {
        addToast({ type: 'error', message: err.response?.data?.message || 'Upload failed' });
      },
    }
  );

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

  // Handlers
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

  const handleUploadChange = (e) => {
    setUploadData({
      ...uploadData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) {
        addToast({ type: 'error', message: 'Video file too large (Max 5GB)' });
        return;
      }
      setVideoFile(file);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) setThumbnailFile(file);
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

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('displayName', formData.displayName);
    data.append('bio', formData.bio);
    data.append('socialLinks', JSON.stringify(formData.socialLinks));
    data.append('specialties', JSON.stringify(formData.specialties));
    if (avatarFile) data.append('avatar', avatarFile);
    updateMutation.mutate(data);
  };

  const handleUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!videoFile) return addToast({ type: 'warning', message: 'Select a video file' });

    const data = new FormData();
    data.append('video', videoFile);
    if (thumbnailFile) data.append('thumbnail', thumbnailFile);
    data.append('title', uploadData.title);
    data.append('description', uploadData.description);
    data.append('category', uploadData.category);
    data.append('difficulty', uploadData.difficulty);
    data.append('visibility', uploadData.visibility);
    if (uploadData.tags) data.append('tags', uploadData.tags);
    if (uploadData.toolsUsed) data.append('toolsUsed', uploadData.toolsUsed);

    uploadMutation.mutate(data);
  };

  const handleUpgradeSubmit = (e) => {
    if (e) e.preventDefault();
    if (!upgradeData.channelName.trim()) {
      return addToast({ type: 'error', message: 'Please enter a channel name' });
    }
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
              <div className="px-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Account</div>
              <a 
                href="#identity" 
                onClick={() => setActiveSection('identity')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition text-sm font-medium ${
                  activeSection === 'identity' ? 'bg-dark-900 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FaUser size={14} /> Identity
              </a>
              <a 
                href="#expertise" 
                onClick={() => setActiveSection('expertise')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition text-sm font-medium ${
                  activeSection === 'expertise' ? 'bg-dark-900 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FaBug size={14} /> Expertise
              </a>
              <a 
                href="#social" 
                onClick={() => setActiveSection('social')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition text-sm font-medium ${
                  activeSection === 'social' ? 'bg-dark-900 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FaLink size={14} /> Social Links
              </a>
              <a 
                href="#security" 
                onClick={() => setActiveSection('security')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition text-sm font-medium ${
                  activeSection === 'security' ? 'bg-dark-900 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FaShieldAlt size={14} /> Security
              </a>
              
              {user?.isStreamer && (
                <>
                  <div className="px-4 mb-2 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Studio</div>
                  <a 
                    href="#upload" 
                    onClick={() => setActiveSection('upload')}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition text-sm font-medium ${
                      activeSection === 'upload' ? 'bg-dark-900 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-900'
                    }`}
                  >
                    <FaFileUpload size={14} /> Deploy Content
                  </a>
                </>
              )}
              
              <div className="px-4 mb-2 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Settings</div>
              <a 
                href="#streamer" 
                onClick={() => setActiveSection('streamer')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition text-sm font-medium ${
                  activeSection === 'streamer' ? 'bg-dark-900 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FaVideo size={14} /> Creator Status
              </a>
            </nav>
          </div>
        </aside>

        {/* Right Side: Content */}
        <main className="flex-1 space-y-12">
          
          <form onSubmit={handleProfileSubmit} className="space-y-12">
            
            {/* Identity */}
            <div id="identity" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-white uppercase tracking-widest">Public Identity</h3>
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
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-white uppercase tracking-widest">Expertise</h3>
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
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-white uppercase tracking-widest">Social Links</h3>
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

          {/* Security (2FA) */}
          <div id="security" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Security</h3>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-md overflow-hidden">
              <div className="p-8 border-b border-dark-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                      <h4 className="text-white font-bold">Two-Factor Authentication</h4>
                      {user?.isTwoFactorEnabled ? (
                        <span className="text-[10px] font-black bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 tracking-widest">ENABLED</span>
                      ) : (
                        <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 tracking-widest">DISABLED</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 max-w-lg">Protect your account with an extra security layer. Once enabled, you'll need to provide a 6-digit code from your authenticator app to sign in.</p>
                  </div>

                  {!user?.isTwoFactorEnabled && !show2FASetup && (
                    <Button 
                      onClick={() => setup2FAMutation.mutate()} 
                      loading={setup2FAMutation.isLoading}
                      variant="primary"
                    >
                      Configure 2FA
                    </Button>
                  )}

                  {user?.isTwoFactorEnabled && (
                    <button 
                      onClick={() => setShow2FADisableConfirm(true)}
                      className="px-5 py-2.5 rounded-md bg-dark-800 border border-dark-700 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all shadow-sm"
                    >
                      Disable 2FA
                    </button>
                  )}
                </div>
              </div>

              {/* Step-by-Step Setup UI */}
              {!user?.isTwoFactorEnabled && show2FASetup && (
                <div className="p-8 bg-dark-950/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Step 1 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-white font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[10px]">1</span>
                        Scan QR Code
                      </div>
                      <div 
                        className="bg-white p-3 rounded-xl inline-block shadow-2xl cursor-zoom-in hover:scale-[1.02] transition-transform"
                        onClick={() => setIsQRZoomed(true)}
                      >
                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">Open your authenticator app and scan this code. Click image to enlarge.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-white font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[10px]">2</span>
                        Enter Code
                      </div>
                      <div className="space-y-3">
                        <div className="relative">
                          <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
                          <input
                            type="text"
                            placeholder="000 000"
                            className="w-full bg-dark-900 border border-dark-700 rounded-md pl-9 pr-4 py-2.5 text-sm text-white tracking-[0.3em] font-bold focus:outline-none focus:border-primary-500 transition-all"
                            value={twoFactorToken}
                            onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          />
                        </div>
                        <Button 
                          onClick={() => verify2FAMutation.mutate(twoFactorToken)} 
                          loading={verify2FAMutation.isLoading}
                          disabled={twoFactorToken.length !== 6}
                          fullWidth
                        >
                          Verify & Activate
                        </Button>
                      </div>
                    </div>

                    {/* Step 3 (Info) */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-white font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[10px]">3</span>
                        Secure Account
                      </div>
                      <div className="p-4 bg-primary-600/5 border border-primary-500/10 rounded-xl">
                        <p className="text-xs text-primary-400/80 leading-relaxed">Once verified, your account will be protected by military-grade TOTP encryption. Keep your device safe.</p>
                      </div>
                      <button 
                        onClick={() => setShow2FASetup(false)}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        Cancel Setup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unified Upload Section */}
          {user?.isStreamer && (
            <div id="upload" className="scroll-mt-24 pt-12 border-t border-dark-800">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-white uppercase tracking-widest">Deploy Content</h3>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-12">
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
                    helpText="1280x720 (16:9). JPG or PNG."
                    disabled={uploadMutation.isLoading}
                    variant="compact"
                  />
                </div>

                <div className="space-y-6">
                  <Input
                    label="Video Title"
                    required
                    type="text"
                    name="title"
                    value={uploadData.title}
                    onChange={handleUploadChange}
                    maxLength={100}
                    placeholder="e.g., Identifying SQL Injection in Node.js Apps"
                    disabled={uploadMutation.isLoading}
                    icon={FaVideo}
                  />
                  
                  <Textarea
                    label="Comprehensive Description"
                    required
                    name="description"
                    value={uploadData.description}
                    onChange={handleUploadChange}
                    maxLength={5000}
                    rows={6}
                    placeholder="What will viewers learn from this technical deep-dive?"
                    disabled={uploadMutation.isLoading}
                    showCount
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <CustomSelect
                      label="Category"
                      options={categories}
                      value={uploadData.category}
                      onChange={(val) => setUploadData({...uploadData, category: val})}
                      icon={FaList}
                    />

                    <CustomSelect
                      label="Difficulty Level"
                      options={difficultyLevels}
                      value={uploadData.difficulty}
                      onChange={(val) => setUploadData({...uploadData, difficulty: val})}
                      icon={FaTools}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Search Tags"
                      type="text"
                      name="tags"
                      value={uploadData.tags}
                      onChange={handleUploadChange}
                      placeholder="sql, injection, nodejs"
                      helpText="Comma separated"
                      disabled={uploadMutation.isLoading}
                      icon={FaTags}
                    />

                    <Input
                      label="Tools Demonstrated"
                      type="text"
                      name="toolsUsed"
                      value={uploadData.toolsUsed}
                      onChange={handleUploadChange}
                      placeholder="Burp Suite, SQLMap"
                      helpText="Comma separated"
                      disabled={uploadMutation.isLoading}
                      icon={FaTools}
                    />
                  </div>

                  <div className="max-w-md">
                    <CustomSelect
                      label="Visibility"
                      options={visibilityOptions}
                      value={uploadData.visibility}
                      onChange={(val) => setUploadData({...uploadData, visibility: val})}
                      icon={FaEye}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-4">
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
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={uploadMutation.isLoading || !videoFile} loading={uploadMutation.isLoading} icon={FaUpload} className="px-10">Deploy Content</Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Status/Control */}
          <div id="streamer" className="scroll-mt-24 pt-12 border-t border-dark-800">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Creator Status</h3>
            </div>
            {!user?.isStreamer ? (
              <div className="bg-dark-900 border border-dark-800 rounded-md p-8 flex flex-col md:flex-row gap-8 items-center justify-between border-primary-900/20">
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Activate Streamer Mode</h3>
                  <p className="text-xs text-gray-500">Required to upload research content and create a dedicated channel page.</p>
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
        message={`Warning: The channel name "${upgradeData.channelName}" will be permanently linked to your account. Do you want to proceed?`}
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

      <ConfirmDialog
        isOpen={show2FADisableConfirm}
        onClose={() => {
          setShow2FADisableConfirm(false);
          setConfirmPassword('');
        }}
        onConfirm={(pass) => disable2FAMutation.mutate(pass)}
        title="Disable Two-Factor Authentication"
        message="To disable 2FA, please enter your password to verify your identity. This will make your account less secure."
        confirmText="Confirm & Disable"
        type="danger"
        showInput={true}
        inputValue={confirmPassword}
        onInputChange={setConfirmPassword}
        inputPlaceholder="Enter your password"
        inputType="password"
      />

      {/* QR Code Zoom Modal */}
      {isQRZoomed && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6"
          onClick={() => setIsQRZoomed(false)}
        >
          <div className="relative bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fadeIn" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsQRZoomed(false)}
              className="absolute -top-12 right-0 text-white hover:text-primary-400 transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <FaTimes /> Close
            </button>
            <img src={qrCode} alt="2FA QR Code Large" className="w-full h-auto" />
            <div className="mt-4 text-center">
              <p className="text-black font-bold text-sm">Authenticator Protocol</p>
              <p className="text-gray-500 text-xs mt-1">Scan with Google Authenticator or Authy</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
