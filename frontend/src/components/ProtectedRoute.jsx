import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, requireStreamer = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireStreamer && !user?.isStreamer) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
