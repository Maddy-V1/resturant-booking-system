import api from './api';

// Hardcoded orders for offline mode or test users
const FALLBACK_ORDERS = [
  {
    _id: 'offline-order-1',
    orderNumber: 'ORD-001',
    createdAt: new Date().toISOString(),
    status: 'ready',
    items: [
      {
        name: 'Item-2 (Live)',
        quantity: 2,
        price: 120
      },
      {
        name: 'Item-1 (Packaged)',
        quantity: 1,
        price: 50
      }
    ],
    totalAmount: 290,
    paymentMethod: 'online',
    paymentStatus: 'paid'
  },
  {
    _id: 'offline-order-2',
    orderNumber: 'ORD-002',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    status: 'delivered',
    items: [
      {
        name: 'Item-1 (Live)',
        quantity: 1,
        price: 120
      }
    ],
    totalAmount: 120,
    paymentMethod: 'counter',
    paymentStatus: 'pending'
  },
  {
    _id: 'offline-order-3',
    orderNumber: 'ORD-003',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    status: 'delivered',
    items: [
      {
        name: 'Item-2 (Packaged)',
        quantity: 3,
        price: 80
      },
      {
        name: 'Item-1 (Live)',
        quantity: 1,
        price: 120
      }
    ],
    totalAmount: 360,
    paymentMethod: 'online',
    paymentStatus: 'paid'
  }
];

// Check if user is a test user
const isTestUser = () => {
  const token = localStorage.getItem('userToken');
  return token && token.startsWith('test-token-');
};

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    // If test user, always use fallback (don't call backend)
    if (isTestUser()) {
      console.log('Test user: Simulating order creation');
      const newOrder = {
        _id: 'offline-order-' + Date.now(),
        orderNumber: 'ORD-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        createdAt: new Date().toISOString(),
        status: 'pending',
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentMethod === 'online' ? 'paid' : 'pending'
      };
      return { success: true, data: newOrder };
    }

    // Real user - call backend
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
    // If test user, always use fallback (don't call backend)
    if (isTestUser()) {
      console.log('Test user: Using fallback orders');
      return { success: true, data: FALLBACK_ORDERS };
    }

    // Real user - call backend
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
    // If test user, try to find in fallback orders
    if (isTestUser()) {
      const order = FALLBACK_ORDERS.find(o => o._id === id);
      if (order) {
        return { success: true, data: order };
      }
      return {
        success: false,
        error: { message: 'Order not found', code: 'NOT_FOUND' }
      };
    }

    // Real user - call backend
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