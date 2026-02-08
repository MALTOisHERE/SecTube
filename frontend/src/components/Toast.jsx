import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import useToastStore from '../store/toastStore';

const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  useEffect(() => {
    // Start exit animation before auto-close
    if (toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300);

      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FaCheckCircle className="text-green-400 text-xl flex-shrink-0" />;
      case 'error':
        return <FaExclamationCircle className="text-red-400 text-xl flex-shrink-0" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-400 text-xl flex-shrink-0" />;
      default:
        return <FaInfoCircle className="text-primary-500 text-xl flex-shrink-0" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/50';
      case 'error':
        return 'bg-red-500/10 border-red-500/50';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/50';
      default:
        return 'bg-primary-500/10 border-primary-500/50';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg min-w-[320px] max-w-md transition-all duration-300 ${getBackgroundColor()} ${
        isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      }`}
    >
      {getIcon()}
      <p className="flex-1 text-sm text-white leading-relaxed">{toast.message}</p>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-white transition flex-shrink-0 p-1"
        aria-label="Close notification"
      >
        <FaTimes className="text-sm" />
      </button>
    </div>
  );
};

export default Toast;
