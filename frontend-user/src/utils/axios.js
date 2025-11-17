import axios from 'axios';

const resolveBaseURL = () => {
  const url =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api`
      : null);

  const browserBase =
    typeof window !== 'undefined'
      ? `${window.location.origin.replace(/\/$/, '')}/api`
      : null;

  return (
    url ||
    browserBase ||
    'http://localhost:5001/api'
  );
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: resolveBaseURL()
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple redirects
let isRedirecting = false;

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Token expired or invalid
      isRedirecting = true;
      localStorage.removeItem('token');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      // Reset flag after a delay
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export default api;