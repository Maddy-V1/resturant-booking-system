import api from './api';

// Hardcoded menu items for offline mode (when backend is not available)
const FALLBACK_MENU_ITEMS = [
  // Live Food Items
  {
    _id: 'offline-live-1',
    name: 'Item-1 (Live)',
    description: 'Freshly prepared hot meal',
    price: 120,
    dealPrice: null,
    isDealOfDay: false,
    available: true,
    type: 'live',
    imageUrl: '',
    sometimes: false,
    discountPercentage: 0
  },
  {
    _id: 'offline-live-2',
    name: 'Item-2 (Live)',
    description: 'Delicious cooked food',
    price: 150,
    dealPrice: 120,
    isDealOfDay: true,
    available: true,
    type: 'live',
    imageUrl: '',
    sometimes: false,
    discountPercentage: 20
  },
  {
    _id: 'offline-live-3',
    name: 'Item-3 (Live)',
    description: 'Special preparation',
    price: 180,
    dealPrice: null,
    isDealOfDay: false,
    available: false,
    type: 'live',
    imageUrl: '',
    sometimes: true,
    discountPercentage: 0
  },
  
  // Packaged Food Items
  {
    _id: 'offline-packaged-1',
    name: 'Item-1 (Packaged)',
    description: 'Ready to eat snack',
    price: 50,
    dealPrice: null,
    isDealOfDay: false,
    available: true,
    type: 'packaged',
    imageUrl: '',
    sometimes: false,
    discountPercentage: 0
  },
  {
    _id: 'offline-packaged-2',
    name: 'Item-2 (Packaged)',
    description: 'Quick bite option',
    price: 80,
    dealPrice: null,
    isDealOfDay: false,
    available: false,
    type: 'packaged',
    imageUrl: '',
    sometimes: true,
    discountPercentage: 0
  }
];

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
      console.log('Backend unavailable, using fallback menu items');
      // Return hardcoded menu items when backend is not available
      return { success: true, data: FALLBACK_MENU_ITEMS };
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
      // Try to find item in fallback data
      const item = FALLBACK_MENU_ITEMS.find(item => item._id === id);
      if (item) {
        return { success: true, data: item };
      }
      return {
        success: false,
        error: error.response?.data?.error || { message: 'Failed to fetch menu item', code: 'FETCH_ERROR' }
      };
    }
  }
};
