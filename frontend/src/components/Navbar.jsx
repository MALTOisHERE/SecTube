import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUpload, FaUser, FaSignOutAlt, FaBars, FaCog, FaVideo } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import useSidebarStore from '../store/sidebarStore';
import ConfirmDialog from './ConfirmDialog';
import Z_INDEX from '../config/zIndex';
import { getAvatarUrl } from '../config/constants';
import { useDropdownPosition, getDropdownClasses } from '../hooks/useDropdownPosition';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { toggleSidebar } = useSidebarStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const userMenuPosition = useDropdownPosition(userMenuRef, showUserMenu, 200);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

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
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <img src="/logo.png" alt="SecTube Logo" className="h-10 w-auto" />
            <span className="bg-primary-600/10 text-primary-500 border border-primary-500/20 px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
              Beta
            </span>
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
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-dark-800 transition border-2 border-transparent hover:border-dark-700"
              >
                <img
                  src={getAvatarUrl(user?.avatar)}
                  alt={user?.displayName || user?.username}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = getAvatarUrl('default-avatar.svg');
                  }}
                />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className={`absolute right-0 ${getDropdownClasses(userMenuPosition)} w-56 bg-dark-900 rounded-md shadow-xl border border-dark-700 py-1.5 z-50`}>
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-dark-800">
                    <p className="text-sm font-medium text-white truncate">{user?.displayName || user?.username}</p>
                    <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-dark-800 transition text-sm text-gray-300 hover:text-white"
                    >
                      <FaCog size={14} />
                      <span>Settings</span>
                    </Link>
                    {user?.isStreamer && (
                      <Link
                        to={`/channel/${user?.username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-dark-800 transition text-sm text-gray-300 hover:text-white"
                      >
                        <FaVideo size={14} />
                        <span>My Channel</span>
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-dark-800 py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogoutClick();
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-dark-800 transition text-sm text-red-500 hover:text-red-400 w-full"
                    >
                      <FaSignOutAlt size={14} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
