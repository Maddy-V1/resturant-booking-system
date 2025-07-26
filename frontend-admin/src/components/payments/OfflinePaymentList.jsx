import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import io from 'socket.io-client';

const OfflinePaymentList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(null);
  const [socket, setSocket] = useState(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchPendingPayments();
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
      if (orderData.paymentMethod === 'offline') {
        fetchPendingPayments(); // Refresh pending payments list
      }
    });

    newSocket.on('payment-confirmed', (data) => {
      console.log('Payment confirmed:', data);
      fetchPendingPayments(); // Refresh pending payments list
    });

    setSocket(newSocket);
  };

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/staff/pending-payments');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setError('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (orderId) => {
    try {
      setConfirmingPayment(orderId);
      setError(null);

      await api.put(`/staff/orders/${orderId}/payment`, {
        paymentStatus: 'paid'
      });

      // Refresh the list after confirmation
      await fetchPendingPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to confirm payment';
      setError(errorMessage);
    } finally {
      setConfirmingPayment(null);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTimeSinceOrder = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ${diffInMinutes % 60}m ago`;
    }
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

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Offline Payment Confirmation</h1>
                <p className="text-gray-600 mt-1">Confirm cash payments from customers</p>
                <p className="text-sm text-blue-600 mt-1">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Confirming payment will add orders to the preparation queue
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{orders.length}</span> pending payments
                </div>
                <button
                  onClick={fetchPendingPayments}
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

        {/* Payment List */}
        {orders.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All payments confirmed!</h3>
            <p className="text-gray-500">No orders are waiting for cash payment confirmation.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Orders Awaiting Cash Payment</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{order.customerWhatsapp}</p>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          <p>{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</p>
                          <p className="font-medium text-orange-600">{getTimeSinceOrder(order.createdAt)}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="text-gray-600">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-gray-900 font-medium">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Payment Section */}
                    <div className="ml-6 text-right">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">₹{calculateTotal(order.items)}</p>
                        <p className="text-sm text-orange-600 font-medium">Cash Payment Pending</p>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => confirmPayment(order._id)}
                          disabled={confirmingPayment === order._id}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {confirmingPayment === order._id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Confirming...
                            </div>
                          ) : (
                            'Confirm Cash Payment'
                          )}
                        </button>
                        
                        <p className="text-xs text-gray-500">
                          Click after receiving ₹{calculateTotal(order.items)} in cash
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        Payment Pending
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Order will move to preparation queue after payment confirmation
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Payment Confirmation Instructions</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Collect the exact cash amount from the customer</li>
                  <li>Verify the order details and total amount</li>
                  <li>Click "Confirm Cash Payment" only after receiving payment</li>
                  <li>The order will automatically move to the preparation queue</li>
                  <li>Customer will receive real-time status updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePaymentList;