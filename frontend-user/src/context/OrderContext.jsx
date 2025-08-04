import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartStorage } from '../utils/localStorage';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

// For backward compatibility
export const useOrders = () => {
  return useOrder();
};

export const OrderProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = cartStorage.getCart();
    if (Array.isArray(savedCart) && savedCart.length > 0) {
      setCartItems(savedCart);
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      cartStorage.setCart(cartItems);
    }
  }, [cartItems, isInitialized]);

  // Function to trigger refresh of order-related components
  const triggerOrderRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);



  // Cart functions
  const addToCart = useCallback((item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        return [...prevItems, { ...item }];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  const updateCartItemQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    cartStorage.clearCart();
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getCartItemCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // Order functions
  const placeOrder = useCallback(async (orderData) => {
    try {
      const { orderService } = await import('../services/orderService');
      
      // Transform cart items to API format
      const items = orderData.items.map(item => ({
        itemId: item.id,
        quantity: item.quantity
      }));

      const result = await orderService.createOrder({
        items,
        paymentMethod: 'online' // Default to online payment
      });

      if (result.success) {
        // Transform the order data to ensure consistent ID format
        const transformedOrder = {
          ...result.data,
          id: result.data._id || result.data.id
        };
        
        setOrders(prevOrders => [transformedOrder, ...prevOrders]);
        triggerOrderRefresh();
        return transformedOrder;
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }, [triggerOrderRefresh]);

  const value = {
    // Legacy
    refreshTrigger,
    triggerOrderRefresh,
    
    // Cart
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    
    // Orders
    orders,
    placeOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};