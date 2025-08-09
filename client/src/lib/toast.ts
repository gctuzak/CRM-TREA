import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages, {
      position: 'top-right',
    });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  custom: (message: string, options?: any) => {
    toast(message, {
      position: 'top-right',
      ...options,
    });
  }
};

// Utility functions for common scenarios
export const apiToast = {
  success: (action: string) => showToast.success(`${action} başarıyla tamamlandı`),
  error: (action: string, error?: any) => {
    const message = error?.response?.data?.message || error?.message || 'Bir hata oluştu';
    showToast.error(`${action} sırasında hata: ${message}`);
  },
  loading: (action: string) => showToast.loading(`${action}...`),
};

export default showToast;