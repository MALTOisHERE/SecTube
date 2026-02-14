import { FaExclamationTriangle } from 'react-icons/fa';
import Z_INDEX from '../config/zIndex';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 border-red-700',
    },
    warning: {
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700 border-yellow-700',
    },
    info: {
      icon: 'text-primary-500',
      button: 'bg-primary-600 hover:bg-primary-700 border-primary-700',
    },
  };

  const styles = typeStyles[type] || typeStyles.danger;

  return (
    <div
      className="fixed flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
      style={{
        top: '-50px',
        left: '-50px',
        right: '-50px',
        bottom: '-50px',
        zIndex: Z_INDEX.MODAL_OVERLAY,
        position: 'fixed',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        className="bg-dark-900 border border-dark-800 rounded-md shadow-2xl max-w-md w-full p-5 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <FaExclamationTriangle className={`text-lg ${styles.icon} mt-0.5`} />
          <div>
            <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{message}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-md font-medium transition text-sm border border-dark-600"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 ${styles.button} rounded-md font-medium transition text-sm border shadow-sm`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
