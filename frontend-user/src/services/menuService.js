import api from './api';

export const menuService = {
  // Get all menu items
  getMenuItems: async () => {
    try {
      const response = await api.get('/menu');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to fetch menu items', code: 'FETCH_ERROR' }
      };
    }
  },

  // Get menu item by ID
  getMenuItem: async (id) => {
    try {
      const response = await api.get(`/menu/${id}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to fetch menu item', code: 'FETCH_ERROR' }
      };
    }
  }
};