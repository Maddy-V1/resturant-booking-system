import api from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, data: { token, user } };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Login failed', code: 'LOGIN_ERROR' }
      };
    }
  },

  // Register user
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, data: { token, user } };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Signup failed', code: 'SIGNUP_ERROR' }
      };
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      if (response.data.success) {
        const { user } = response.data.data;
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, data: { user } };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Token verification failed', code: 'VERIFY_ERROR' }
      };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }
};