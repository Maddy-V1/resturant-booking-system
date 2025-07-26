import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import io from 'socket.io-client';

const OrderQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [socket, setSocket] = useState(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchOrders();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('join-staff-room');
    });

    newSocket.on('new-order', (orderData) => {
      console.log('New order received:', orderData);
      fetchOrders(); // Refresh orders list
    });

    newSocket.on('order-status-updated', (data) => {
      console.log('Order status updated:', data);
      fetchOrders(); // Refresh orders list
    });

    newSocket.on('payment-confirmed', (data) => {
      console.log('Payment confirmed:', data);
      fetchOrders(); // Refresh orders list
    });

    setSocket(newSocket);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/staff/orders');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: newStatus
      });
      
      // Refresh orders after update
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'orderNumber':
          return a.orderNumber.localeCompare(b.orderNumber);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'confirmed';
      case 'confirmed':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return null;
    }
  };

  const getStatusButtonText = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'Confirm Order';
      case 'confirmed':
        return 'Start Preparing';
      case 'preparing':
        return 'Mark Ready';
      case 'ready':
        return 'Mark Completed';
      default:
        return null;
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>
                <p className="text-gray-600 mt-1">Manage confirmed orders and track preparation status</p>
                <p className="text-sm text-blue-600 mt-1">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Only orders with confirmed payment are shown here
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="orderNumber">Order Number</option>
                </select>

                <button
                  onClick={fetchOrders}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">
              {filter === 'all' ? 'No orders found.' : `No ${filter} orders found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-900">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between text-sm font-medium">
                    <span>Total:</span>
                    <span>₹{calculateTotal(order.items)}</span>
                  </div>
                  
                  {/* Payment Info */}
                  <div className="mt-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentMethod === 'offline' 
                        ? (order.paymentStatus === 'paid' ? 'Cash Paid' : 'Cash Pending')
                        : 'Online Paid'
                      }
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                    >
                      View Details
                    </button>
                    
                    {getNextStatus(order.status) && order.paymentStatus === 'paid' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        {getStatusButtonText(order.status)}
                      </button>
                    )}
                    
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Number</label>
                    <p className="text-sm text-gray-900">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerWhatsapp}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Time</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment</label>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
                  <div className="border border-gray-200 rounded-md">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                          <p className="text-sm text-gray-600">₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-gray-50 flex justify-between font-medium">
                      <span>Total:</span>
                      <span>₹{calculateTotal(selectedOrder.items)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderQueue;