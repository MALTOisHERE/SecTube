import { FaExclamationTriangle } from 'react-icons/fa';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-600',
      iconBg: 'bg-red-600/10 border-red-600/20',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-600/10 border-yellow-600/20',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-primary-600',
      iconBg: 'bg-primary-600/10 border-primary-600/20',
      button: 'bg-primary-600 hover:bg-primary-700',
    },
  };

  const styles = typeStyles[type] || typeStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 ${styles.iconBg} border rounded-lg flex items-center justify-center flex-shrink-0`}>
            <FaExclamationTriangle className={`text-xl ${styles.icon}`} />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="text-gray-300 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg font-medium transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 ${styles.button} rounded-lg font-medium transition shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
