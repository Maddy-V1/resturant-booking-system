import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Package } from 'lucide-react';
import { orderService } from '../../services/orderService';
import StatusBadge from '../common/StatusBadge';
import Toast from '../common/Toast';
import { useSocket } from '../../context/SocketContext';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const { joinOrderRoom, leaveOrderRoom, subscribeToOrderUpdates, isConnected } = useSocket();

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      
      // Join the order-specific room for real-time updates
      if (isConnected) {
        joinOrderRoom(orderId);
      }
      
      // Subscribe to order status updates
      const unsubscribe = subscribeToOrderUpdates((data) => {
        if (data.orderId === orderId) {
          console.log('Received order update:', data);
          
          // Show toast notification for status changes
          const statusMessages = {
            'preparing': 'Your order is now being prepared! 👨‍🍳',
            'ready': 'Your order is ready for pickup! 🎉',
            'picked_up': 'Order completed - Thank you! ✅'
          };
          
          if (statusMessages[data.status]) {
            setToast({
              message: statusMessages[data.status],
              type: 'success'
            });
          }
          
          // Update the order state with new data
          setOrder(prevOrder => {
            if (!prevOrder) return prevOrder;
            
            return {
              ...prevOrder,
              status: data.status,
              paymentStatus: data.paymentStatus || prevOrder.paymentStatus,
              updatedAt: data.updatedAt
            };
          });
        }
      });
      
      // Cleanup function
      return () => {
        if (orderId) {
          leaveOrderRoom(orderId);
        }
        unsubscribe();
      };
    }
  }, [orderId, isConnected, joinOrderRoom, leaveOrderRoom, subscribeToOrderUpdates]);

  // Join room when socket connects
  useEffect(() => {
    if (isConnected && orderId) {
      joinOrderRoom(orderId);
    }
  }, [isConnected, orderId, joinOrderRoom]);



  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const result = await orderService.getOrder(orderId);
      
      if (result.success) {
        // Transform API data to match frontend format
        const transformedOrder = {
          id: result.data._id,
          orderNumber: result.data.orderNumber,
          createdAt: result.data.createdAt,
          status: result.data.status,
          items: result.data.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: result.data.totalAmount,
          paymentMethod: result.data.paymentMethod,
          pickupLocation: 'Main Canteen',
          otp: result.data.otp
        };
        
        setOrder(transformedOrder);
      } else {
        setError(result.error.message);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'payment pending':
      case 'pending':
        return 'Please complete payment at the counter to start preparation';
      case 'confirmed':
        return 'Payment confirmed! Your order will be prepared soon';
      case 'preparing':
        return 'Your order is being prepared with care';
      case 'ready':
        return 'Your order is ready for pickup!';
      case 'picked_up':
        return 'Order completed - Thank you!';
      default:
        return 'Processing your order...';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-12 bg-gray-300 rounded mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <Link
            to="/orders"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors duration-200 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Track Order</h1>
        </div>
        
        <div className="px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">😔</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <Link
              to="/orders"
              className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <Link
            to="/orders"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors duration-200 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Track Order</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Order Header - Order Number and Status on same line */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              #{order.orderNumber}
            </h2>
            <StatusBadge status={order.status} size="sm" />
          </div>

          {/* Order Items List */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-medium text-gray-900 text-sm block truncate">{item.name}</span>
                    <span className="text-gray-500 text-xs">× {item.quantity}</span>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">₹{order.total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Status Message with Payment Method */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-start mb-2">
              <Clock className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-orange-800 font-medium text-sm leading-relaxed">{getStatusMessage(order.status)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-orange-800 text-sm font-medium">Payment: Online (UPI/Gateway)</span>
              </div>
              {/* Real-time connection indicator */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* OTP Display */}
          {order.otp && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <span className="text-green-600 font-bold text-sm">🔐</span>
                  </div>
                  <div>
                    <p className="text-green-800 font-medium text-sm">Pickup OTP</p>
                    <p className="text-green-600 text-xs">Show this to pickup counter</p>
                  </div>
                </div>
                <div className="text-right">
                  {order.status === 'ready' ? (
                    <div className="bg-green-600 text-white px-3 py-1 rounded-lg">
                      <span className="text-lg font-bold tracking-wider">{order.otp}</span>
                    </div>
                  ) : (
                    <div className="bg-gray-300 text-gray-500 px-3 py-1 rounded-lg">
                      <span className="text-lg font-bold tracking-wider blur-sm select-none">••••</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">
                {order.status === 'ready' 
                  ? 'OTP is now visible - show this to pickup counter' 
                  : 'OTP will be revealed when order is ready for pickup'
                }
              </div>
            </div>
          )}

          {/* Order Time */}
          <div className="text-center">
            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default OrderTracking;