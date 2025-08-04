import api from './api';

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to create order', code: 'CREATE_ERROR' }
      };
    }
  },

  // Get all orders for current user
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to fetch orders', code: 'FETCH_ERROR' }
      };
    }
  },

  // Get order by ID
  getOrder: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to fetch order', code: 'FETCH_ERROR' }
      };
    }
  }
};