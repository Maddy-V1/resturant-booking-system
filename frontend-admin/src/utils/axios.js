import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if it's a test user
      const token = localStorage.getItem('adminToken');
      const isTestUser = token && token.startsWith('test-admin-token-');
      
      // Only redirect if NOT a test user
      if (!isTestUser) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('testStaff');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;