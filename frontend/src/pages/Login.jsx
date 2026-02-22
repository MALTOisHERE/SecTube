import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaEnvelope, FaLock, FaShieldAlt, FaTerminal, FaBug, FaDatabase, FaCode, FaNetworkWired, FaGithub, FaGoogle } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // Check for errors in URL (from SSO redirection)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      addToast({ type: 'error', message: error });
      // Remove error from URL
      searchParams.delete('error');
      setSearchParams(searchParams);
    }
  }, [searchParams, addToast, setSearchParams]);

  const handleGithubLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/github`;
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      login(response.data.user, response.data.token);
      addToast({ type: 'success', message: 'Welcome back! Login successful.' });
      navigate('/');
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Login failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-dark-950 overflow-hidden">
      {/* Left Side: Form (Reverted to previous design) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-dark-950 z-10">
        <div className="w-full max-w-md">
          <div className="p-4 sm:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
              <p className="text-sm text-gray-400">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-dark-900 border border-dark-700 rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-dark-900 border border-dark-700 rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 py-2.5 rounded-md font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed border border-primary-700 shadow-sm mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </div>
                ) : 'Sign in'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-dark-950 px-2 text-gray-500 font-bold tracking-widest">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleGithubLogin}
                  className="flex items-center justify-center gap-3 bg-dark-900 hover:bg-dark-800 border border-dark-700 py-2.5 rounded-md font-semibold text-sm transition-all shadow-sm"
                >
                  <FaGithub size={18} />
                  <span>GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-3 bg-dark-900 hover:bg-dark-800 border border-dark-700 py-2.5 rounded-md font-semibold text-sm transition-all shadow-sm"
                >
                  <FaGoogle size={18} className="text-red-500" />
                  <span>Google</span>
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-dark-800">
              <p className="text-center text-sm text-gray-400 font-medium">
                New to SecTube?{' '}
                <Link to="/register" className="text-primary-500 hover:text-primary-400 transition ml-1 font-medium">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Enhanced Visual Content (Kept as is) */}
      <div className="hidden md:flex md:w-1/2 bg-dark-900 relative overflow-hidden items-center justify-center border-l border-dark-800">
        {/* Animated Perspective Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-100px)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))'
          }}
        ></div>

        {/* Floating Icons */}
        <div className="absolute top-20 left-20 animate-bounce duration-[4000ms] text-primary-500/20"><FaTerminal size={40} /></div>
        <div className="absolute top-40 right-20 animate-bounce duration-[3000ms] text-blue-500/20"><FaCode size={32} /></div>
        <div className="absolute bottom-40 left-32 animate-bounce duration-[5000ms] text-primary-500/20"><FaBug size={36} /></div>
        <div className="absolute bottom-20 right-32 animate-bounce duration-[3500ms] text-blue-500/20"><FaDatabase size={28} /></div>
        <div className="absolute top-1/2 right-10 animate-pulse text-primary-500/10"><FaNetworkWired size={60} /></div>

        {/* Scan Line Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-[2px] bg-primary-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] absolute top-0 animate-[scan_4s_linear_infinite]"></div>
        </div>

        {/* Logo at top right */}
        <Link to="/" className="absolute top-8 right-8 z-20 hover:scale-105 transition-transform">
          <img src="/logo.png" alt="SecTube Logo" className="h-10 w-auto filter drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
        </Link>

        {/* Background Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 text-center px-12 max-w-lg flex flex-col items-center">
          {/* Central Shield with Glow */}
          <div className="relative mb-10 group">
            <div className="absolute inset-0 bg-primary-500/20 rounded-3xl blur-2xl group-hover:bg-primary-500/30 transition-all duration-500"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-dark-800 border border-dark-700 shadow-2xl transition-transform duration-500 group-hover:scale-110">
              <FaShieldAlt className="text-primary-500 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" size={48} />
            </div>
          </div>

          <h2 className="text-4xl font-black text-white mb-6 leading-tight tracking-tight">
            Elevate Your <span className="text-primary-500">Security</span> IQ
          </h2>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">
            The premier hub for ethical hackers and researchers to share, learn, and defend.
          </p>
          
          <div className="flex justify-center gap-10">
            <div className="text-center group">
              <div className="text-white font-black text-3xl group-hover:text-primary-400 transition-colors">2k+</div>
              <div className="text-gray-500 text-xs uppercase tracking-widest font-black mt-1">Videos</div>
            </div>
            <div className="w-px h-12 bg-dark-700 self-center"></div>
            <div className="text-center group">
              <div className="text-white font-black text-3xl group-hover:text-primary-400 transition-colors">5k+</div>
              <div className="text-gray-500 text-xs uppercase tracking-widest font-black mt-1">Researchers</div>
            </div>
          </div>

          {/* Fake "Scanning" indicator */}
          <div className="mt-12 flex items-center gap-3 bg-dark-800/50 px-4 py-2 rounded-full border border-dark-700 backdrop-blur-sm">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Secure // Live Feed</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};

export default Login;
