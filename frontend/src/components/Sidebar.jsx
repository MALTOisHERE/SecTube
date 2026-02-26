import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaFire, FaHistory, FaBookmark, FaVideo, FaBell, FaChartBar } from 'react-icons/fa';
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
    ...(user?.isStreamer ? [
      { path: `/channel/${user?.username}`, icon: FaVideo, label: 'My Channel' },
      { path: '/analytics', icon: FaChartBar, label: 'Analytics' }
    ] : []),
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
        <div className="w-64 flex flex-col min-h-full">
        <div>
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

        {/* Footer info at bottom of sidebar */}
        <div className="mt-auto px-4 py-6 border-t border-dark-800">
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-wider">
            <Link to="/terms" className="hover:text-primary-500 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacy</Link>
            <span className="cursor-default">Policy & Safety</span>
          </div>
          <p className="text-[10px] text-gray-600 font-medium">
            © {new Date().getFullYear()} SecTube
          </p>
          <p className="text-[10px] text-gray-500 font-bold mt-1.5">
            Developed by <a href="https://github.com/MALTOisHERE" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 transition-colors">MALTO</a>
          </p>
        </div>
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;
