import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaFire, FaHistory, FaBookmark, FaUser, FaBell } from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import useSidebarStore from '../store/sidebarStore';

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
          className="fixed inset-0 bg-black bg-opacity-60 z-40 top-14"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 bottom-0 bg-dark-900 border-r border-dark-800 border-t border-dark-800 overflow-y-auto transition-all duration-300 z-50 ${
          isOpen ? 'w-64' : 'w-0'
        }`}
      >
      {isOpen && (
        <div className="w-64">
        {/* Main Navigation */}
        <div>
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-3 hover:bg-dark-800 transition ${
                index === 0 ? 'pt-4' : ''
              } ${
                isActive(item.path) ? 'bg-dark-800 text-primary-500' : 'text-gray-300'
              }`}
            >
              <item.icon className="text-xl" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-dark-800 mt-4 mb-4"></div>

        {/* Authenticated User Navigation */}
        {isAuthenticated ? (
          <div>
            {authNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-3 hover:bg-dark-800 transition ${
                  isActive(item.path) ? 'bg-dark-800 text-primary-500' : 'text-gray-300'
                }`}
              >
                <item.icon className="text-xl" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-3">
            <p className="text-xs text-gray-400 mb-3">
              Sign in to access more features
            </p>
            <Link
              to="/login"
              className="block text-center bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition"
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
