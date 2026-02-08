import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUpload, FaUser, FaSignOutAlt, FaHome, FaTh } from 'react-icons/fa';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import ConfirmDialog from './ConfirmDialog';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    addToast({ type: 'info', message: 'You have been logged out successfully.' });
    navigate('/');
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="bg-dark-900 border-b border-dark-800 sticky top-0 z-50">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src="/logo.png" alt="SecTube Logo" className="h-10 w-auto" />
        </Link>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-dark-800 border border-dark-700 rounded-l-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary-600"
            />
            <button
              type="submit"
              className="bg-dark-800 border border-l-0 border-dark-700 rounded-r-full px-6 py-2 hover:bg-dark-700"
            >
              <FaSearch className="text-gray-400" />
            </button>
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {user?.isStreamer && (
                <Link
                  to="/upload"
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded text-sm font-medium text-white"
                >
                  <FaUpload className="text-sm" />
                  <span>Upload</span>
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-dark-800 text-sm"
              >
                <FaUser className="text-gray-400" />
                <span className="text-white">{user?.username}</span>
              </Link>
              <button
                onClick={handleLogoutClick}
                className="p-2 rounded hover:bg-dark-800"
                title="Logout"
              >
                <FaSignOutAlt className="text-gray-400" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded text-sm font-medium text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Secondary navigation */}
      <div className="border-t border-dark-800 px-4 h-12 flex items-center gap-6 overflow-x-auto">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white whitespace-nowrap"
        >
          <FaHome className="text-sm" />
          <span>Home</span>
        </Link>
        <Link
          to="/browse"
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white whitespace-nowrap"
        >
          <FaTh className="text-sm" />
          <span>Browse</span>
        </Link>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        type="warning"
      />
    </nav>
  );
};

export default Navbar;
