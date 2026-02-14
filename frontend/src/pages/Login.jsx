import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    <div className="px-6 py-12 min-h-[85vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-dark-900 border border-dark-800 p-6 rounded-md shadow-lg">
          {/* Header with icon */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4">
              <img src="/logo.png" alt="SecTube Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-xl font-semibold text-center text-white">Sign in to SecTube</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-900 border border-dark-700 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500"
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
                  className="w-full bg-dark-900 border border-dark-700 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 py-2 rounded-md font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed border border-primary-700 shadow-sm"
            >
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-dark-800">
            <p className="text-center text-sm text-gray-400">
              New to SecTube?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
