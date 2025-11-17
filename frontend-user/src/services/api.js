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
  baseURL: resolveBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;