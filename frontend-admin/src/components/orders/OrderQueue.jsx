import React, { useState, useEffect } from 'react';
import {
  Clock,
  ChefHat,
  User,
  Phone,
  CreditCard,
  RefreshCw,
  Info,
  X,
  Timer,
  DollarSign,
  Utensils,
  ArrowRight,
  Filter
} from 'lucide-react';
import api from '../../utils/axios';
import io from 'socket.io-client';
import soundUtils from '../../utils/soundUtils';

// Order Details Modal Component
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
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${order.paymentStatus === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {order.paymentStatus === 'paid' ? '✅ Payment Confirmed' : '⏳ Payment Pending'}
                </span>
                <p className="text-xs text-gray-600 mt-1">UPI/Gateway Payment</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{calculateTotal(order.items)}</p>
              </div>
            </div>
          </div>

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

const OrderQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('oldest');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [movingToPickup, setMovingToPickup] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [lapHistory, setLapHistory] = useState([]);
  const [currentLapNumber, setCurrentLapNumber] = useState(1);
  const [socketConnected, setSocketConnected] = useState(false);

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
      soundUtils.playDoubleBeep(); // Play sound for new order
      fetchOrders(false); // Don't show loader for real-time updates
    });

    newSocket.on('order-status-updated', (data) => {
      console.log('Order status updated:', data);
      fetchOrders(false); // Don't show loader for real-time updates
    });

    newSocket.on('order-moved-to-kitchen', (data) => {
      console.log('Order moved to kitchen:', data);
      fetchOrders(false); // Refresh kitchen orders
    });

    newSocket.on('order-moved-to-pickup', (data) => {
      console.log('Order moved to pickup:', data);
      soundUtils.playSuccessSound(); // Play success sound
      // Update orders list to remove from kitchen
      setOrders(prevOrders => prevOrders.filter(order => order._id !== data.orderId));
    });

    newSocket.on('order-completed', (data) => {
      console.log('Order completed:', data);
      // Remove completed order from kitchen view
      setOrders(prevOrders => prevOrders.filter(order => order._id !== data.orderId));
    });

    newSocket.on('payment-confirmed', (data) => {
      console.log('Payment confirmed:', data);
      fetchOrders(false); // Don't show loader for real-time updates
    });

    setSocket(newSocket);
  };

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.get('/staff/orders');
      const ordersData = response.data.data || [];
      // Filter only preparing orders since all orders will be in preparing status
      const preparingOrders = ordersData.filter(order => order.status === 'preparing');
      setOrders(preparingOrders);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const moveToPickup = async (orderId) => {
    try {
      setMovingToPickup(orderId);
      await api.put(`/orders/${orderId}/status`, {
        status: 'ready'
      });

      await fetchOrders(false);

      const orderNumber = orders.find(o => o._id === orderId)?.orderNumber;
      console.log(`Order ${orderNumber} moved to pickup`);
    } catch (error) {
      console.error('Error moving order to pickup:', error);
      setError(`Failed to move order to pickup: ${error.response?.data?.message || error.message}`);
    } finally {
      setMovingToPickup(null);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

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

  // Get current items to prepare (only from orders not in any lap)
  const getCurrentItems = () => {
    const itemMap = new Map();
    const lappedOrderIds = new Set();

    // Collect all order IDs that are in lap history
    lapHistory.forEach(lap => {
      lap.orderIds.forEach(id => lappedOrderIds.add(id));
    });

    // Only count orders that haven't been lapped yet
    const currentOrders = filteredOrders.filter(order => !lappedOrderIds.has(order._id));

    currentOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.name;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key);
          existing.quantity += item.quantity;
        } else {
          itemMap.set(key, {
            name: item.name,
            quantity: item.quantity
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  };

  // Get items for a specific lap (dynamically calculated from current orders)
  const getLapItems = (lapOrderIds) => {
    const itemMap = new Map();

    // Only count orders that are still in the kitchen queue
    const activeOrders = filteredOrders.filter(order => lapOrderIds.includes(order._id));

    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.name;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key);
          existing.quantity += item.quantity;
        } else {
          itemMap.set(key, {
            name: item.name,
            quantity: item.quantity
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  };

  // Handle lap completion
  const handleLap = () => {
    const lappedOrderIds = new Set();

    // Collect all order IDs that are already in lap history
    lapHistory.forEach(lap => {
      lap.orderIds.forEach(id => lappedOrderIds.add(id));
    });

    // Get current orders that haven't been lapped
    const currentOrders = filteredOrders.filter(order => !lappedOrderIds.has(order._id));
    const currentOrderIds = currentOrders.map(order => order._id);

    if (currentOrderIds.length > 0) {
      const newLap = {
        lapNumber: currentLapNumber,
        orderIds: currentOrderIds,
        timestamp: new Date()
      };

      setLapHistory(prev => [...prev, newLap]);
      setCurrentLapNumber(prev => prev + 1);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ChefHat className="h-8 w-8 text-orange-600 mr-3" />
                  Kitchen Orders
                </h1>
                <p className="text-gray-600 mt-2">Orders currently being prepared ({filteredOrders.length})</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-2">
                        <button
                          onClick={() => { setFilter('all'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        >
                          All Orders
                        </button>

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
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
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

        {/* Kitchen Layout - Dynamic based on lap history */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders in kitchen</h3>
            <p className="text-gray-500">
              All orders have been moved to pickup or no orders are being prepared.
            </p>
          </div>
        ) : lapHistory.length === 0 ? (
          /* No Laps - Original Layout */
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            {/* Left 4 Parts - All Orders */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-green-200 hover:shadow-lg transition-all duration-200 relative"
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

                    {/* Move to Pickup Button */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <button
                        onClick={() => moveToPickup(order._id)}
                        disabled={movingToPickup === order._id}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                      >
                        {movingToPickup === order._id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Move to Pickup
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 2 Parts - Items to Prepare Only */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-orange-200">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold flex items-center">
                        <ChefHat className="h-6 w-6 mr-2" />
                        Items to Prepare
                      </h3>
                      <p className="text-orange-100 text-sm mt-1">
                        Current batch - Lap {currentLapNumber}
                      </p>
                    </div>
                    {getCurrentItems().length > 0 && (
                      <button
                        onClick={handleLap}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Lap
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-96">
                  {getCurrentItems().length === 0 ? (
                    <div className="text-center py-8">
                      <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No items to prepare</p>
                      <p className="text-xs text-gray-400 mt-1">New orders will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getCurrentItems().map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {item.quantity}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{item.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">
                              ×{item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Has Laps - Split Screen Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-screen">
            {/* LEFT HALF - Lapped Orders + Lapped Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side: Lapped Orders (one per line) */}
              <div className="overflow-y-auto">
                <div className="flex items-center mb-3">
                  <h2 className="text-lg font-bold text-gray-600 flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    Lapped Orders
                  </h2>
                </div>

                <div className="space-y-4">
                  {lapHistory.slice().reverse().map((lap) => {
                    const lapOrders = filteredOrders.filter(order => lap.orderIds.includes(order._id));

                    return lapOrders.length > 0 ? (
                      <div key={lap.lapNumber}>
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            Lap {lap.lapNumber}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {lapOrders.map((order) => (
                            <div
                              key={order._id}
                              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-300 hover:shadow-lg transition-all duration-200 relative opacity-75"
                            >
                              {/* Order Header */}
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <h3 className="text-sm font-bold text-gray-700">{order.orderNumber}</h3>
                                      <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                                      >
                                        <Info className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center text-xs text-gray-600">
                                        <User className="h-2 w-2 mr-1" />
                                        {order.customerName}
                                      </div>
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Timer className="h-2 w-2 mr-1" />
                                        {getTimeElapsed(order.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Order Items - Compact */}
                              <div className="px-3 py-2">
                                <div className="space-y-1 max-h-16 overflow-y-auto">
                                  {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-xs">
                                      <div className="flex items-center space-x-1">
                                        <span className="bg-gray-100 text-gray-700 text-xs font-medium px-1 py-0.5 rounded">
                                          {item.quantity}x
                                        </span>
                                        <span className="text-gray-700 truncate">{item.name}</span>
                                      </div>
                                      <span className="text-gray-600 font-medium">₹{item.price * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="border-t mt-1 pt-1 flex justify-between items-center">
                                  <span className="text-xs font-medium text-gray-600">Total:</span>
                                  <span className="text-sm font-bold text-gray-700">₹{calculateTotal(order.items)}</span>
                                </div>
                              </div>

                              {/* Move to Pickup Button */}
                              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                                <button
                                  onClick={() => moveToPickup(order._id)}
                                  disabled={movingToPickup === order._id}
                                  className="w-full bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                                >
                                  {movingToPickup === order._id ? (
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                  )}
                                  Move to Pickup
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Right Side: Lapped Items */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="px-4 py-3 bg-gray-100 rounded-t-xl">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Lapped Items
                  </h3>
                </div>

                <div className="p-4 overflow-y-auto max-h-96">
                  <div className="space-y-4">
                    {lapHistory.slice().reverse().map((lap, index) => {
                      const lapItems = getLapItems(lap.orderIds);
                      const hasActiveItems = lapItems.length > 0;

                      return (
                        <div key={lap.lapNumber} className="border-l-4 border-gray-300 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-700">
                              Lap {lap.lapNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              {lap.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {hasActiveItems ? (
                            <div className="space-y-1">
                              {lapItems.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                      {item.quantity}
                                    </div>
                                    <span className="text-gray-700">{item.name}</span>
                                  </div>
                                  <span className="text-gray-600 font-medium">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-1">
                              <span className="text-xs text-gray-400 italic">All completed</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT HALF - New Orders + Current Items */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Side: New Orders (one per line) */}
              <div className="overflow-y-auto">
                <div className="flex items-center mb-3">
                  <h2 className="text-lg font-bold text-green-700 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    New Orders
                  </h2>
                </div>

                <div className="space-y-3">
                  {filteredOrders.filter(order => {
                    const lappedOrderIds = new Set();
                    lapHistory.forEach(lap => {
                      lap.orderIds.forEach(id => lappedOrderIds.add(id));
                    });
                    return !lappedOrderIds.has(order._id);
                  }).map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-green-200 hover:shadow-lg transition-all duration-200 relative"
                    >
                      {/* Order Header */}
                      <div className="px-3 py-2 bg-green-50 border-b border-green-100">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-bold text-gray-900">{order.orderNumber}</h3>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                              >
                                <Info className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-600">
                                <User className="h-2 w-2 mr-1" />
                                {order.customerName}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Timer className="h-2 w-2 mr-1" />
                                {getTimeElapsed(order.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items - Compact */}
                      <div className="px-3 py-2">
                        <div className="space-y-1 max-h-16 overflow-y-auto">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-1">
                                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-1 py-0.5 rounded">
                                  {item.quantity}x
                                </span>
                                <span className="text-gray-900 truncate">{item.name}</span>
                              </div>
                              <span className="text-gray-700 font-medium">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t mt-1 pt-1 flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Total:</span>
                          <span className="text-sm font-bold text-gray-900">₹{calculateTotal(order.items)}</span>
                        </div>
                      </div>

                      {/* Move to Pickup Button */}
                      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                        <button
                          onClick={() => moveToPickup(order._id)}
                          disabled={movingToPickup === order._id}
                          className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                        >
                          {movingToPickup === order._id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3 w-3 mr-1" />
                          )}
                          Move to Pickup
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Current Items to Prepare */}
              <div className="bg-white rounded-xl shadow-lg border border-orange-200">
                <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold flex items-center">
                        <ChefHat className="h-5 w-5 mr-2" />
                        Items to Prepare
                      </h3>
                      <p className="text-orange-100 text-xs mt-1">
                        Current batch - Lap {currentLapNumber}
                      </p>
                    </div>
                    {getCurrentItems().length > 0 && (
                      <button
                        onClick={handleLap}
                        className="bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
                      >
                        Lap
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 overflow-y-auto max-h-96">
                  {getCurrentItems().length === 0 ? (
                    <div className="text-center py-8">
                      <Utensils className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No items to prepare</p>
                      <p className="text-xs text-gray-400 mt-1">New orders will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getCurrentItems().map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {item.quantity}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-orange-600">
                              ×{item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      </div>
    </div>
  );
};

export default OrderQueue;