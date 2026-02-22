import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from 'react-query';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToastStore();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const verifyMutation = useMutation(() => authAPI.verifyEmail(token), {
    onSuccess: (response) => {
      setStatus('success');
      // Redirect to login instead of automatic login
      setTimeout(() => {
        addToast({ type: 'success', message: 'Email verified! Please sign in to your new account.' });
        navigate('/login');
      }, 3000);
    },
    onError: (err) => {
      // Only set error if we aren't already successful
      setStatus((current) => (current === 'success' ? 'success' : 'error'));
      setErrorMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
    }
  });

  useEffect(() => {
    // Only trigger if we are in initial state
    if (token && status === 'verifying' && !verifyMutation.isLoading && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate();
    } else if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided.');
    }
  }, [token, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <FaSpinner className="text-primary-500 animate-spin" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-white">Verifying your account...</h1>
            <p className="text-gray-400">Please wait while we authorize your research access.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-center">
              <FaCheckCircle className="text-green-500" size={64} />
            </div>
            <h1 className="text-2xl font-bold text-white">Verification Successful!</h1>
            <p className="text-gray-400">Your account is now active. Redirecting you to the app...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-center">
              <FaExclamationCircle className="text-red-500" size={64} />
            </div>
            <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-red-400/80">{errorMessage}</p>
            <div className="pt-4">
              <Link 
                to="/register" 
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-md font-bold transition-all"
              >
                Try Registering Again
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
