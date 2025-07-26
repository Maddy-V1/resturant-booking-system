import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { useOrders } from '../../context/OrderContext';
import { useToast } from '../../context/ToastContext';

const ClaimableOrders = () => {
  const [claimableOrders, setClaimableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingOrder, setClaimingOrder] = useState(null);
  const { triggerOrderRefresh } = useOrders();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchClaimableOrders();
  }, []);

  const fetchClaimableOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/claimable-orders');
      
      if (response.data.success) {
        setClaimableOrders(response.data.data);
      } else {
        setError(response.data.error?.message || 'Failed to fetch claimable orders');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch claimable orders');
      console.error('Claimable orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimOrder = async (orderId, claim) => {
    try {
      setClaimingOrder(orderId);
      const response = await api.post(`/users/claim-order/${orderId}`, { claim });
      
      if (response.data.success) {
        // Remove the order from claimable list
        setClaimableOrders(prev => prev.filter(order => order._id !== orderId));
        
        // Trigger refresh of order history and other order-related components
        triggerOrderRefresh();
        
        // Show success message
        const message = claim ? 'Order claimed successfully! It now appears in your order history.' : 'Order rejected successfully!';
        showSuccess(message, 4000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to process claim';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Claim order error:', err);
    } finally {
      setClaimingOrder(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 text-center">
          <p>Error: {error}</p>
          <button 
            onClick={fetchClaimableOrders}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (claimableOrders.length === 0) {
    return null; // Don't show anything if no claimable orders
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Orders Placed for You
      </h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Notice:</strong> We found orders placed by staff that match your WhatsApp number. 
          Please confirm if these orders were placed for you.
        </p>
      </div>

      <div className="space-y-4">
        {claimableOrders.map((order) => (
          <div key={order._id} className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Order #{order.orderNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Placed on {formatDate(order.createdAt)}
                </p>
                <p className="text-sm text-gray-600">
                  Customer: {order.customerName}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">
                  ₹{calculateTotal(order.items).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
              <ul className="space-y-1">
                {order.items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-md p-4 border border-yellow-200">
              <p className="text-sm font-medium text-gray-900 mb-3">
                Was this order placed for you?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleClaimOrder(order._id, true)}
                  disabled={claimingOrder === order._id}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claimingOrder === order._id ? 'Processing...' : 'Yes, it\'s mine'}
                </button>
                <button
                  onClick={() => handleClaimOrder(order._id, false)}
                  disabled={claimingOrder === order._id}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claimingOrder === order._id ? 'Processing...' : 'No, not mine'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClaimableOrders;