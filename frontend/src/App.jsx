import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Home from './pages/Home';
import Video from './pages/Video';
import Channel from './pages/Channel';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AuthSuccess from './pages/AuthSuccess';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Browse from './pages/Browse';
import Search from './pages/Search';
import History from './pages/History';
import Saved from './pages/Saved';
import Subscriptions from './pages/Subscriptions';
import ProtectedRoute from './components/ProtectedRoute';
import { FaTimes } from 'react-icons/fa';
import useAuthStore from './store/authStore';
import useSidebarStore from './store/sidebarStore';

function App() {
  const { isOpen } = useSidebarStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => location.pathname.startsWith(path));
  
  // Dev banner states: 'entering' | 'visible' | 'leaving' | 'hidden'
  const [bannerStatus, setBannerStatus] = useState(() => {
    return localStorage.getItem('hasSeenDevBanner') ? 'hidden' : 'entering';
  });

  useEffect(() => {
    if (bannerStatus === 'hidden') return;

    // Phase 1: Slide Up (entering -> visible)
    const enterTimer = setTimeout(() => setBannerStatus('visible'), 500);
    
    // Phase 2: Start Sliding Down after 10s
    const leaveTimer = setTimeout(() => {
      setBannerStatus('leaving');
      localStorage.setItem('hasSeenDevBanner', 'true');
    }, 10000);
    
    // Phase 3: Completely remove from DOM after slide down animation completes
    const hideTimer = setTimeout(() => setBannerStatus('hidden'), 10500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, [bannerStatus]);

  const handleCloseBanner = () => {
    setBannerStatus('leaving');
    localStorage.setItem('hasSeenDevBanner', 'true');
    setTimeout(() => setBannerStatus('hidden'), 500);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {bannerStatus !== 'hidden' && (
        <div className={`bg-red-600/90 text-white py-3 px-4 text-center text-xs font-bold uppercase tracking-[0.2em] fixed bottom-0 left-0 right-0 z-[2000] backdrop-blur-sm flex items-center justify-center gap-3 transition-all duration-500 ${
          bannerStatus === 'entering' || bannerStatus === 'leaving' ? 'animate-slideDown' : 'animate-slideUp'
        }`}>
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          Platform Status: Development Mode // Unauthorized usage restricted
          <button 
            onClick={handleCloseBanner}
            className="absolute right-4 hover:text-gray-300 transition-colors"
            aria-label="Close banner"
          >
            <FaTimes size={14} />
          </button>
        </div>
      )}
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <Sidebar />}
      <Toast />
      <main className={isAuthPage ? 'w-full min-h-screen' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/video/:videoId" element={<Video />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
          />
                              <Route 
                                path="/register" 
                                element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
                              />
                                        <Route path="/forgot-password" element={<ForgotPassword />} />
                                        <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
                                        <Route path="/verify-email/:token" element={<VerifyEmail />} />
                                        <Route path="/auth-success" element={<AuthSuccess />} />
                                                  <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route
                      path="/settings"
          
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <Saved />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute>
                <Subscriptions />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
