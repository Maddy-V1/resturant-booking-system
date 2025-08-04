import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only initialize socket connection if user is authenticated
    if (!isAuthenticated) {
      // Disconnect socket if user is not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setError(null);
      }
      return;
    }

    // Initialize socket connection with authentication
    const token = localStorage.getItem('token');
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      auth: {
        token: token
      }
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError(error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setError(error.message);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated]); // Re-run when authentication status changes

  // Helper function to join order room
  const joinOrderRoom = (orderId) => {
    if (socket && isConnected) {
      socket.emit('join-order-room', orderId);
      console.log('Joined order room:', orderId);
    }
  };

  // Helper function to leave order room
  const leaveOrderRoom = (orderId) => {
    if (socket && isConnected) {
      socket.emit('leave-order-room', orderId);
      console.log('Left order room:', orderId);
    }
  };

  // Helper function to subscribe to order status updates
  const subscribeToOrderUpdates = (callback) => {
    if (socket) {
      socket.on('order-status-updated', callback);
      return () => socket.off('order-status-updated', callback);
    }
    return () => {};
  };

  // Helper function to subscribe to payment confirmations
  const subscribeToPaymentUpdates = (callback) => {
    if (socket) {
      socket.on('payment-confirmed', callback);
      return () => socket.off('payment-confirmed', callback);
    }
    return () => {};
  };

  const value = {
    socket,
    isConnected,
    error,
    joinOrderRoom,
    leaveOrderRoom,
    subscribeToOrderUpdates,
    subscribeToPaymentUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;