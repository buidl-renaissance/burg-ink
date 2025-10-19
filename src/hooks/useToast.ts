import { useState, useCallback } from 'react';
import { Toast, ToastType } from '@/components/common/Toast';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      type,
      ...options,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((options: ToastOptions) => {
    return addToast('success', options);
  }, [addToast]);

  const error = useCallback((options: ToastOptions) => {
    return addToast('error', options);
  }, [addToast]);

  const warning = useCallback((options: ToastOptions) => {
    return addToast('warning', options);
  }, [addToast]);

  const info = useCallback((options: ToastOptions) => {
    return addToast('info', options);
  }, [addToast]);

  const loading = useCallback((options: ToastOptions) => {
    return addToast('loading', options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    loading,
  };
};
