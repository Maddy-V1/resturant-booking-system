import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  User,
  Phone,
  CreditCard,
  RefreshCw,
  Info,
  X,
  Timer,
  DollarSign,
  Utensils,
  CheckCircle,
  Filter,
  ExternalLink,
  Package,
  Search
} from 'lucide-react';
import api from '../../utils/axios';
import io from 'socket.io-client';
import soundUtils from '../../utils/soundUtils';
import ManualOrderModal from './ManualOrderModal';

// Order Details Modal Component (same as in OrderQueue)
const OrderDetailsModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Customer Information
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">WhatsApp:</span>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <p className="font-medium text-gray-900">{order.customerWhatsapp}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Order Time:</span>
                <p className="font-medium text-gray-900">
                  {new Date(order.createdAt).toLocaleString('en-IN')} ({getTimeElapsed(order.createdAt)})
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-green-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Payment Information
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                  ✅ Payment Confirmed
                </span>
                <p className="text-xs text-gray-600 mt-1">UPI/Gateway Payment</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{calculateTotal(order.items)}</p>
              </div>
            </div>
          </div>

          {/* OTP Information */}
          {order.otp && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <span className="text-blue-600 font-bold text-sm">🔐</span>
                </div>
                Pickup Verification
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-medium text-sm">4-Digit OTP</p>
                  <p className="text-blue-600 text-xs">Customer must provide this OTP</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  <span className="text-xl font-bold tracking-wider">{order.otp}</span>
                </div>
              </div>
            </div>
          )}

          {/* Items Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Utensils className="h-5 w-5 mr-2 text-orange-600" />
              Order Items ({order.items.length})
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">₹{item.price} per item</p>
                  </div>
                  <div className="text-center mx-4">
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                      {item.quantity}x
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-gray-50 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-gray-900">₹{calculateTotal(order.items)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PickupQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('oldest');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [markingDelivered, setMarkingDelivered] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

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
    const token = localStorage.getItem('adminToken');
    console.log('Initializing socket with token:', token ? 'Token present' : 'No token');
    console.log('Socket URL:', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setSocketConnected(true);
      newSocket.emit('join-staff-room');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
      setError('Failed to connect to real-time updates');
    });

    newSocket.on('joined-staff-room', (data) => {
      console.log('Successfully joined staff room:', data);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Socket connection error');
      setSocketConnected(false);
    });



    newSocket.on('new-order', (orderData) => {
      console.log('New order received:', orderData);
      // New orders don't directly affect pickup queue
    });

    newSocket.on('order-status-updated', (data) => {
      console.log('Order status updated:', data);
      fetchOrders(false);
    });

    newSocket.on('order-moved-to-pickup', (data) => {
      console.log('Order moved to pickup:', data);
      soundUtils.playNotificationBeep(); // Play sound for new pickup order
      fetchOrders(false); // Refresh pickup orders to include new ready order
    });

    newSocket.on('order-completed', (data) => {
      console.log('Order completed:', data);
      // Remove completed order from pickup view
      setOrders(prevOrders => prevOrders.filter(order => order._id !== data.orderId));
    });

    newSocket.on('payment-confirmed', (data) => {
      console.log('Payment confirmed:', data);
      fetchOrders(false);
    });

    setSocket(newSocket);
  };

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.get('/staff/orders');
      const ordersData = response.data.data || [];
      // Filter only ready orders (orders ready for pickup)
      const readyOrders = ordersData.filter(order => order.status === 'ready');
      setOrders(readyOrders);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleMarkAsDelivered = (order) => {
    setSelectedOrderForOtp(order);
    setOtpInput('');
    setOtpError('');
    setShowOtpModal(true);
  };

  const verifyOtpAndMarkDelivered = async () => {
    if (!selectedOrderForOtp) return;

    if (otpInput.length !== 4) {
      setOtpError('Please enter a 4-digit OTP');
      return;
    }

    if (otpInput !== selectedOrderForOtp.otp) {
      setOtpError('Invalid OTP. Please check and try again.');
      return;
    }

    try {
      setMarkingDelivered(selectedOrderForOtp._id);
      await api.put(`/orders/${selectedOrderForOtp._id}/status`, {
        status: 'picked_up'
      });

      await fetchOrders(false);

      console.log(`Order ${selectedOrderForOtp.orderNumber} marked as delivered with OTP verification`);
      setShowOtpModal(false);
      setSelectedOrderForOtp(null);
      setOtpInput('');
      setOtpError('');
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      setError(`Failed to mark order as delivered: ${errorMessage}`);
    } finally {
      setMarkingDelivered(null);
    }
  };

  const markAsDelivered = async (orderId) => {
    try {
      setMarkingDelivered(orderId);
      await api.put(`/orders/${orderId}/status`, {
        status: 'picked_up'
      });

      await fetchOrders(false);

      const orderNumber = orders.find(o => o._id === orderId)?.orderNumber;
      console.log(`Order ${orderNumber} marked as delivered`);
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      setError(`Failed to mark order as delivered: ${errorMessage}`);
    } finally {
      setMarkingDelivered(null);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(query) ||
        order.customerWhatsapp.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query)
      );
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
          return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

    return filtered;
  };

  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m ago`;
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pickup orders...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  Pickup Counter
                </h1>
                <p className="text-gray-600 mt-2">Orders ready for customer pickup ({filteredOrders.length})</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 w-full md:w-64"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Sort
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-2">
                        <button
                          onClick={() => { setSortBy('oldest'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === 'oldest' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        >
                          Oldest First
                        </button>
                        <button
                          onClick={() => { setSortBy('newest'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === 'newest' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        >
                          Newest First
                        </button>
                        <button
                          onClick={() => { setSortBy('orderNumber'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === 'orderNumber' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        >
                          Order Number
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Status */}
                <div className="flex items-center mr-3">
                  <div className={`w-2 h-2 rounded-full mr-2 ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {socketConnected ? 'Live' : 'Offline'}
                  </span>
                </div>

                {/* Manual Order Button */}
                <button
                  onClick={() => setShowManualOrderModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 mr-3"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manual Order
                </button>

                {/* Debug: Reconnect Socket Connection */}
                {!socketConnected && (
                  <button
                    onClick={() => {
                      if (socket) {
                        socket.disconnect();
                      }
                      initializeSocket();
                    }}
                    className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors duration-200 mr-3"
                  >
                    Reconnect
                  </button>
                )}

                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery.trim() ? 'No orders found' : 'No orders ready for pickup'}
            </h3>
            <p className="text-gray-500">
              {searchQuery.trim()
                ? `No orders found for "${searchQuery}". Try a different search term.`
                : 'Orders will appear here when they are ready for customer pickup.'
              }
            </p>
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 relative"
              >
                {/* Order Header */}
                <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-3 w-3 mr-1" />
                          {order.customerName}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Timer className="h-3 w-3 mr-1" />
                          {getTimeElapsed(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items - Compact */}
                <div className="px-4 py-3">
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                            {item.quantity}x
                          </span>
                          <span className="text-gray-900 truncate">{item.name}</span>
                        </div>
                        <span className="text-gray-700 font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-2 pt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-lg font-bold text-gray-900">₹{calculateTotal(order.items)}</span>
                  </div>
                </div>

                {/* Mark as Delivered Button */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => handleMarkAsDelivered(order)}
                    disabled={markingDelivered === order._id}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                  >
                    {markingDelivered === order._id ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Mark as Delivered
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Orders Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Completed Orders</h3>
              <p className="text-sm text-gray-600">Orders are automatically marked as completed when delivered</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-xs text-gray-500">Auto-tracked</div>
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />

        {/* Manual Order Modal */}
        <ManualOrderModal
          isOpen={showManualOrderModal}
          onClose={() => setShowManualOrderModal(false)}
          onOrderCreated={(newOrder) => {
            console.log('New manual order created:', newOrder);
            fetchOrders(false); // Refresh orders list
          }}
        />

        {/* OTP Verification Modal */}
        {showOtpModal && selectedOrderForOtp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Verify Pickup OTP</h2>
                    <p className="text-sm text-gray-600">Order #{selectedOrderForOtp.orderNumber}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowOtpModal(false);
                      setSelectedOrderForOtp(null);
                      setOtpInput('');
                      setOtpError('');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Customer Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">Customer Details</span>
                  </div>
                  <p className="text-blue-800 font-medium">{selectedOrderForOtp.customerName}</p>
                  <p className="text-blue-600 text-sm">{selectedOrderForOtp.customerWhatsapp}</p>
                </div>

                {/* OTP Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 4-digit OTP from customer
                  </label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setOtpInput(value);
                      setOtpError('');
                    }}
                    placeholder="0000"
                    className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    maxLength="4"
                    autoFocus
                  />
                  {otpError && (
                    <p className="mt-2 text-sm text-red-600">{otpError}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowOtpModal(false);
                      setSelectedOrderForOtp(null);
                      setOtpInput('');
                      setOtpError('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={verifyOtpAndMarkDelivered}
                    disabled={otpInput.length !== 4 || markingDelivered === selectedOrderForOtp._id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {markingDelivered === selectedOrderForOtp._id ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Verify & Mark Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupQueue;