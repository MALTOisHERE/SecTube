import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Chatbot from './components/Chatbot';
import DevBanner from './components/DevBanner';
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
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import useSidebarStore from './store/sidebarStore';

function App() {
  const { isOpen } = useSidebarStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => location.pathname.startsWith(path));
  
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <DevBanner />
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <Sidebar />}
      <Toast />
      <Chatbot />
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
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requireStreamer>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
