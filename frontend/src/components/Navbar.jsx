import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUpload, FaUser, FaSignOutAlt, FaBars } from 'react-icons/fa';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import useSidebarStore from '../store/sidebarStore';
import ConfirmDialog from './ConfirmDialog';
import Z_INDEX from '../config/zIndex';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { toggleSidebar } = useSidebarStore();
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
    <nav className="bg-dark-900 border-b border-dark-800 sticky top-0" style={{ zIndex: Z_INDEX.NAVBAR }}>
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Hamburger Menu & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-300 transition p-2 hover:bg-dark-800 rounded-md border border-transparent"
            aria-label="Toggle sidebar"
          >
            <FaBars size={18} />
          </button>
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="SecTube Logo" className="h-10 w-auto" />
          </Link>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-dark-900 border border-dark-700 rounded-l-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="bg-dark-900 border border-l-0 border-dark-700 rounded-r-md px-4 py-1.5 hover:bg-dark-800 transition"
            >
              <FaSearch className="text-gray-500" size={14} />
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
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-md text-sm font-medium text-white border border-primary-700 shadow-sm"
                >
                  <FaUpload size={14} />
                  <span>Upload</span>
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-dark-800 text-sm transition border border-transparent"
              >
                <FaUser className="text-gray-500" size={14} />
                <span className="text-gray-300">{user?.username}</span>
              </Link>
              <button
                onClick={handleLogoutClick}
                className="p-2 rounded-md hover:bg-dark-800 transition border border-transparent"
                title="Logout"
              >
                <FaSignOutAlt className="text-gray-500" size={14} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white font-medium border border-transparent rounded-md hover:bg-dark-800 transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium text-white border border-primary-700 shadow-sm"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
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
