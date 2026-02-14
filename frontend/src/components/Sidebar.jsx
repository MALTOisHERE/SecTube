import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaFire, FaHistory, FaBookmark, FaUser, FaBell } from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import useSidebarStore from '../store/sidebarStore';
import Z_INDEX from '../config/zIndex';

const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { isOpen, closeSidebar } = useSidebarStore();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/browse', icon: FaFire, label: 'Browse' },
  ];

  const authNavItems = [
    { path: '/history', icon: FaHistory, label: 'History' },
    { path: '/saved', icon: FaBookmark, label: 'Saved' },
    { path: '/subscriptions', icon: FaBell, label: 'Subscriptions' },
    { path: `/channel/${user?.username}`, icon: FaUser, label: 'Your Channel' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 top-14"
          onClick={closeSidebar}
          style={{ zIndex: Z_INDEX.SIDEBAR_OVERLAY }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 bottom-0 bg-dark-900 border-r border-dark-800 border-t border-dark-800 overflow-y-auto transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-0'
        }`}
        style={{ zIndex: Z_INDEX.SIDEBAR }}
      >
      {isOpen && (
        <div className="w-64">
        {/* Main Navigation */}
        <div>
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 hover:bg-dark-800 transition text-sm font-medium ${
                index === 0 ? 'pt-3' : ''
              } ${
                isActive(item.path) ? 'bg-dark-800 text-primary-400 border-l-2 border-primary-500' : 'text-gray-400 border-l-2 border-transparent'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-dark-800 my-3"></div>

        {/* Authenticated User Navigation */}
        {isAuthenticated ? (
          <div>
            {authNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 hover:bg-dark-800 transition text-sm font-medium ${
                  isActive(item.path) ? 'bg-dark-800 text-primary-400 border-l-2 border-primary-500' : 'text-gray-400 border-l-2 border-transparent'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 mb-3">
              Sign in to access more features
            </p>
            <Link
              to="/login"
              className="block text-center bg-primary-600 hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium transition border border-primary-700 shadow-sm"
            >
              Sign In
            </Link>
          </div>
        )}
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;
