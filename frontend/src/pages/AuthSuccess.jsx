import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToastStore();
  const token = searchParams.get('token');
  const hasHandledAuth = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (token && !hasHandledAuth.current) {
        hasHandledAuth.current = true;
        try {
          // Store token temporarily to fetch user data
          localStorage.setItem('token', token);
          
          // Fetch current user data with the new token
          const response = await authAPI.getMe();
          
          // Login in Zustand store
          login(response.data.data, token);
          
          addToast({ type: 'success', message: 'Successfully signed in!' });
          navigate('/');
        } catch (error) {
          console.error('SSO Authentication error:', error);
          localStorage.removeItem('token');
          addToast({ type: 'error', message: 'Authentication failed. Please try again.' });
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleAuth();
  }, [token, login, navigate, addToast]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-semibold text-white">Completing authentication...</h2>
      <p className="text-gray-400 mt-2">Please wait while we set up your session.</p>
    </div>
  );
};

export default AuthSuccess;
