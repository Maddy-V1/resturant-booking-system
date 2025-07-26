import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration + 300); // Add 300ms for fade out animation
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const value = {
    showToast,
    showSuccess: (message, duration) => showToast(message, 'success', duration),
    showError: (message, duration) => showToast(message, 'error', duration),
    showInfo: (message, duration) => showToast(message, 'info', duration),
    showWarning: (message, duration) => showToast(message, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Render toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ transform: `translateY(${index * 70}px)` }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};