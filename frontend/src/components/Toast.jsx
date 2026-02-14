import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import useToastStore from '../store/toastStore';
import Z_INDEX from '../config/zIndex';

const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 pointer-events-none" style={{ zIndex: Z_INDEX.TOAST }}>
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
        return <FaCheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <FaExclamationCircle className="text-red-500" size={16} />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" size={16} />;
      default:
        return <FaInfoCircle className="text-primary-500" size={16} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-dark-900 border-green-600';
      case 'error':
        return 'bg-dark-900 border-red-600';
      case 'warning':
        return 'bg-dark-900 border-yellow-600';
      default:
        return 'bg-dark-900 border-primary-600';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-3 py-2.5 rounded-md border shadow-lg min-w-[320px] max-w-md transition-all duration-300 ${getBackgroundColor()} ${
        isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      }`}
    >
      {getIcon()}
      <p className="flex-1 text-sm text-gray-200">{toast.message}</p>
      <button
        onClick={handleClose}
        className="text-gray-500 hover:text-gray-300 transition flex-shrink-0"
        aria-label="Close notification"
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
};

export default Toast;
