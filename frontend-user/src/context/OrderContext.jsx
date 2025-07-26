import React, { createContext, useContext, useState, useCallback } from 'react';

const OrderContext = createContext();

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh of order-related components
  const triggerOrderRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value = {
    refreshTrigger,
    triggerOrderRefresh
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};