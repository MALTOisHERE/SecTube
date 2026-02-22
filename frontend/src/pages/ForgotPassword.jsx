import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import useToastStore from '../store/toastStore';
import { FaEnvelope, FaShieldAlt, FaChevronLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const { addToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Initialize state directly from localStorage to prevent flash/reset
  const [countdown, setCountdown] = useState(() => {
    const savedExpiry = localStorage.getItem('reset_cooldown_expiry');
    if (savedExpiry) {
      const remaining = Math.round((parseInt(savedExpiry) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  });

  // Timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        const savedExpiry = localStorage.getItem('reset_cooldown_expiry');
        if (savedExpiry) {
          const remaining = Math.round((parseInt(savedExpiry) - Date.now()) / 1000);
          if (remaining <= 0) {
            setCountdown(0);
            localStorage.removeItem('reset_cooldown_expiry');
          } else {
            setCountdown(remaining);
          }
        } else {
          setCountdown(0);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      addToast({ type: 'success', message: 'Reset link sent! Please check your inbox.' });
      
      // Set cooldown for 30 seconds
      const expiry = Date.now() + 30000;
      localStorage.setItem('reset_cooldown_expiry', expiry.toString());
      setCountdown(30);
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-dark-950 overflow-hidden">
      {/* Left Side: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-dark-950 z-10">
        <div className="w-full max-w-md">
          <div className="p-4 sm:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
              <p className="text-sm text-gray-400">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                <div className="relative group">
                  <FaEnvelope className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 transition-colors" size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-dark-900 border border-dark-700 rounded-md pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || countdown > 0}
                className="w-full bg-primary-600 hover:bg-primary-700 py-2.5 rounded-md font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed border border-primary-700 shadow-sm"
              >
                {loading 
                  ? 'Sending link...' 
                  : countdown > 0 
                    ? `Resend in ${countdown}s` 
                    : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-dark-800 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition font-medium">
                <FaChevronLeft size={12} />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Visual Content */}
      <div className="hidden md:flex md:w-1/2 bg-dark-900 relative overflow-hidden items-center justify-center border-l border-dark-800">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-100px)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))'
          }}
        ></div>

        <Link to="/" className="absolute top-8 right-8 z-20 hover:scale-105 transition-transform flex items-center gap-2">
          <img src="/logo.png" alt="SecTube Logo" className="h-10 w-auto filter drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
          <span className="bg-primary-600/10 text-primary-500 border border-primary-500/20 px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
            Beta
          </span>
        </Link>

        <div className="relative z-10 text-center px-12 max-w-lg flex flex-col items-center">
          <div className="relative mb-10 group">
            <div className="absolute inset-0 bg-primary-500/20 rounded-3xl blur-2xl group-hover:bg-primary-500/30 transition-all duration-500"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-dark-800 border border-dark-700 shadow-2xl transition-transform duration-500 group-hover:scale-110">
              <FaShieldAlt className="text-primary-500 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" size={48} />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-6 leading-tight tracking-tight">
            Account <span className="text-primary-500">Recovery</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">
            Follow the protocol to regain access to your research dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
