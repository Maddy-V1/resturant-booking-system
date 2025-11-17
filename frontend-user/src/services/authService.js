import api from './api';
import { authStorage } from '../utils/authStorage';

export const authService = {
  // Login user
  login: async (credentials, options = {}) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        const { token, user } = response.data.data;
        authStorage.persist({
          token,
          user,
          remember: options.remember !== false
        });
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
  signup: async (userData, options = {}) => {
    try {
      const response = await api.post('/auth/signup', userData);
      if (response.data.success) {
        const { token, user } = response.data.data;
        authStorage.persist({
          token,
          user,
          remember: options.remember !== false
        });
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
        authStorage.updateUser(user);
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
    authStorage.clear();
    return { success: true };
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    return authStorage.getUser();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = authStorage.getToken();
    return !!token;
  }
};