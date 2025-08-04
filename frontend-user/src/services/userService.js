import api from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to fetch profile', code: 'FETCH_ERROR' }
      };
    }
  },

  // Get user statistics (orders and spending)
  getStatistics: async () => {
    try {
      const response = await api.get('/users/statistics');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to fetch statistics', code: 'FETCH_ERROR' }
      };
    }
  }
};