import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import MenuItem from './MenuItem';
import OrderCart from './OrderCart';

const MenuList = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/menu');
      setMenuItems(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity }];
      }
    });
  };

  const updateCartItem = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => {
      const price = item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={fetchMenuItems}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
        
        {/* Cart Button */}
        {cart.length > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Cart ({getTotalItems()})
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {getTotalItems()}
            </span>
          </button>
        )}
      </div>

      {menuItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No menu items available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <MenuItem
              key={item._id}
              item={item}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      )}

      {/* Order Cart Modal */}
      {showCart && (
        <OrderCart
          cart={cart}
          onUpdateItem={updateCartItem}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onClose={() => setShowCart(false)}
          totalAmount={getTotalAmount()}
        />
      )}
    </div>
  );
};

export default MenuList;