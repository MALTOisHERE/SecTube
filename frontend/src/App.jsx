import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Home from './pages/Home';
import Video from './pages/Video';
import Channel from './pages/Channel';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Browse from './pages/Browse';
import Search from './pages/Search';
import History from './pages/History';
import Saved from './pages/Saved';
import Subscriptions from './pages/Subscriptions';
import ProtectedRoute from './components/ProtectedRoute';
import useSidebarStore from './store/sidebarStore';

function App() {
  const { isOpen } = useSidebarStore();

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <Sidebar />
      <Toast />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/video/:videoId" element={<Video />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
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
