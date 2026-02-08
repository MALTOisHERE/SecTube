import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);

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
      const response = await authAPI.register(formData);
      login(response.data.user, response.data.token);
      addToast({ type: 'success', message: 'Account created successfully! Welcome to SecTube.' });
      navigate('/');
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-12 min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-dark-800 border border-dark-700 p-8 rounded-xl shadow-2xl">
          {/* Header with icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6">
              <img src="/logo.png" alt="SecTube Logo" className="h-20 w-auto" />
            </div>
            <h1 className="text-2xl font-semibold text-center">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Username</label>
              <div className="relative group">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary-600 transition" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9_-]+"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                  placeholder="username"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Only letters, numbers, underscores, and hyphens</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Display Name</label>
              <div className="relative group">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary-600 transition" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
              <div className="relative group">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary-600 transition" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <div className="relative group">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary-600 transition" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-600 focus:bg-dark-800 transition text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 mt-6"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
