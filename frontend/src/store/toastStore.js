import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: toast.type || 'info', // success, error, warning, info
      message: toast.message,
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // Helper methods
  success: (message, duration) => {
    set((state) => state.addToast({ type: 'success', message, duration }));
  },

  error: (message, duration) => {
    set((state) => state.addToast({ type: 'error', message, duration }));
  },

  warning: (message, duration) => {
    set((state) => state.addToast({ type: 'warning', message, duration }));
  },

  info: (message, duration) => {
    set((state) => state.addToast({ type: 'info', message, duration }));
  },
}));

export default useToastStore;
