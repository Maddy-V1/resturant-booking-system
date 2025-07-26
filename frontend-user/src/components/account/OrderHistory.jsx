import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';
import { useOrders } from '../../context/OrderContext';

const OrderHistory = ({ limit = null }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [newlyClaimedOrders, setNewlyClaimedOrders] = useState(new Set());
  const { refreshTrigger } = useOrders();

  useEffect(() => {
    if (refreshTrigger === 0) {
      // Initial load
      fetchOrders();
    } else {
      // Refresh triggered by order claim
      fetchOrders(true);
    }
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await api.get('/orders');
      
      if (response.data.success) {
        const ordersToShow = limit ? response.data.data.slice(0, limit) : response.data.data;
        
        // If this is a refresh, identify newly claimed orders
        if (isRefresh) {
          const currentOrderIds = new Set(orders.map(order => order._id));
          const newOrderIds = new Set();
          
          ordersToShow.forEach(order => {
            if (!currentOrderIds.has(order._id) && order.isManualOrder && order.claimStatus === 'claimed') {
              newOrderIds.add(order._id);
            }
          });
          
          setNewlyClaimedOrders(newOrderIds);
          
          // Clear the highlight after 3 seconds
          if (newOrderIds.size > 0) {
            setTimeout(() => {
              setNewlyClaimedOrders(new Set());
            }, 3000);
          }
        }
        
        setOrders(ordersToShow);
      } else {
        setError(response.data.error?.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch orders');
      console.error('Orders fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'payment pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'picked_up':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 text-center">
          <p>Error loading orders: {error}</p>
          <button 
            onClick={fetchOrders}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-800">
            {limit ? `Recent Orders (Last ${limit})` : 'Order History'}
          </h2>
          {refreshing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        {limit && orders.length >= limit && (
          <Link 
            to="/orders" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View More Order History →
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No orders found</p>
          <Link 
            to="/menu" 
            className="mt-2 inline-block text-blue-600 hover:text-blue-800 underline"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className={`border rounded-lg p-4 transition-all duration-500 ${
              newlyClaimedOrders.has(order._id)
                ? 'border-green-300 bg-green-50 shadow-lg transform scale-[1.02]'
                : order.isManualOrder && order.claimStatus === 'claimed' 
                  ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' 
                  : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-800">
                      Order #{order.orderNumber}
                    </h3>
                    {order.isManualOrder && order.claimStatus === 'claimed' && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                        Staff Placed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()} at{' '}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                  {order.isManualOrder && order.claimStatus === 'claimed' && (
                    <p className="text-xs text-orange-600 mt-1">
                      This order was placed by staff and claimed by you
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">Items:</p>
                <ul className="text-sm text-gray-800">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm text-gray-600">
                  Payment: {order.paymentMethod === 'online' ? 'Online' : 'Cash'}
                </div>
                <div className="font-medium text-gray-800">
                  Total: ₹{order.totalAmount.toFixed(2)}
                </div>
              </div>

              <div className="mt-2">
                <Link 
                  to={`/order/${order._id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;