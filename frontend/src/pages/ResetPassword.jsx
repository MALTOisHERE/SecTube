import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaLock, FaUserShield, FaTerminal, FaBug, FaDatabase, FaCode, FaNetworkWired, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const { resettoken } = useParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return addToast({ type: 'error', message: 'Passwords do not match!' });
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(resettoken, { password: formData.password });
      login(response.data.user, response.data.token);
      addToast({ type: 'success', message: 'Password reset successful! Welcome back.' });
      navigate('/');
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Invalid or expired token. Please request a new one.'
      });
      navigate('/forgot-password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-dark-950 overflow-hidden">
      {/* Left Side: Visual Content (Same as Register) */}
      <div className="hidden md:flex md:w-1/2 bg-dark-900 relative overflow-hidden items-center justify-center border-r border-dark-800">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-100px)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))'
          }}
        ></div>

        <Link to="/" className="absolute top-8 left-8 z-20 hover:scale-105 transition-transform flex items-center gap-2">
          <img src="/logo.png" alt="SecTube Logo" className="h-10 w-auto filter drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
          <span className="bg-primary-600/10 text-primary-500 border border-primary-500/20 px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
            Beta
          </span>
        </Link>

        <div className="relative z-10 text-center px-12 max-w-lg flex flex-col items-center">
          <div className="relative mb-10 group">
            <div className="absolute inset-0 bg-primary-500/20 rounded-3xl blur-2xl group-hover:bg-primary-500/30 transition-all duration-500"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-dark-800 border border-dark-700 shadow-2xl transition-transform duration-500 group-hover:scale-110">
              <FaUserShield className="text-primary-500 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" size={48} />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-6 leading-tight tracking-tight">
            Security <span className="text-primary-500">Override</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">
            Reset your access credentials to secure your research node.
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-dark-950 z-10">
        <div className="w-full max-w-md">
          <div className="p-4 sm:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
              <p className="text-sm text-gray-400">Secure your account with a new master key.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                <div className="relative group">
                  <FaLock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 transition-colors" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    className="w-full bg-dark-900 border border-dark-700 rounded-md pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Confirm New Password</label>
                <div className="relative group">
                  <FaLock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 transition-colors" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength="6"
                    className="w-full bg-dark-900 border border-dark-700 rounded-md pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 py-2.5 rounded-md font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed border border-primary-700 shadow-sm"
              >
                {loading ? 'Updating master key...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
