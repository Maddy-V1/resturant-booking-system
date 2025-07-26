import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import OrderStatus from './OrderStatus';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { 
    isConnected, 
    joinOrderRoom, 
    leaveOrderRoom, 
    subscribeToOrderUpdates, 
    subscribeToPaymentUpdates 
  } = useSocket();

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Socket.io integration for real-time updates
  useEffect(() => {
    if (orderId && isConnected) {
      // Join the order room for real-time updates
      joinOrderRoom(orderId);

      // Subscribe to order status updates
      const unsubscribeOrderUpdates = subscribeToOrderUpdates((updatedOrder) => {
        if (updatedOrder.orderNumber === orderId || updatedOrder._id === orderId) {
          console.log('Received order update:', updatedOrder);
          setOrder(prevOrder => ({
            ...prevOrder,
            ...updatedOrder,
            updatedAt: new Date().toISOString()
          }));
        }
      });

      // Subscribe to payment confirmations
      const unsubscribePaymentUpdates = subscribeToPaymentUpdates((paymentUpdate) => {
        if (paymentUpdate.orderNumber === orderId || paymentUpdate.orderId === orderId) {
          console.log('Received payment update:', paymentUpdate);
          setOrder(prevOrder => ({
            ...prevOrder,
            paymentStatus: 'confirmed',
            status: paymentUpdate.newStatus || prevOrder.status,
            updatedAt: new Date().toISOString()
          }));
        }
      });

      // Cleanup function
      return () => {
        leaveOrderRoom(orderId);
        unsubscribeOrderUpdates();
        unsubscribePaymentUpdates();
      };
    }
  }, [orderId, isConnected, joinOrderRoom, leaveOrderRoom, subscribeToOrderUpdates, subscribeToPaymentUpdates]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to copy order link to clipboard
  const copyOrderLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
      console.log('Order link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={fetchOrder}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Status Indicator */}
            <div className={`flex items-center text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {isConnected ? 'Live Updates' : 'Reconnecting...'}
            </div>
          </div>
        </div>
        {order.updatedAt && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {formatDate(order.updatedAt)}
          </p>
        )}
      </div>

      {/* Order Status Progress */}
      <div className="mb-8">
        <OrderStatus 
          status={order.status} 
          paymentStatus={order.paymentStatus}
          paymentMethod={order.paymentMethod}
        />
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
            <p className="text-gray-600">Name: {order.customerName}</p>
            <p className="text-gray-600">WhatsApp: {order.customerWhatsapp}</p>
            <p className="text-gray-600">Order Date: {formatDate(order.createdAt)}</p>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Payment Information</h3>
            <p className="text-gray-600">Method: {order.paymentMethod === 'online' ? 'Online Payment' : 'Cash at Counter'}</p>
            <p className="text-gray-600">Status: {order.paymentStatus === 'confirmed' ? 'Confirmed' : 'Pending'}</p>
            <p className="text-gray-600 font-semibold">Total: ₹{order.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total Amount:</span>
            <span className="text-green-600">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Share Order Link */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Share Order</h2>
        <p className="text-gray-600 mb-4">Share this order tracking link with others:</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={window.location.href}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={copyOrderLink}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap"
          >
            Copy Link
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Anyone with this link can track the order status
        </p>
      </div>
    </div>
  );
};

export default OrderTracking;