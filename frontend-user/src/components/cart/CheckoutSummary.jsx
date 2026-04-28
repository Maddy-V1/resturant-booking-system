import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, AlertCircle } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import api from '../../utils/axios';

const CheckoutSummary = ({ cartItems }) => {
  const [selectedPickupLocation, setSelectedPickupLocation] = useState('main-canteen');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { placeOrder, clearCart } = useOrder();
  const navigate = useNavigate();

  // Check if backend is connected
  useEffect(() => {
    const checkBackendConnection = async () => {
      const token = localStorage.getItem('userToken');
      const isTestUser = token && token.startsWith('test-token-');
      
      if (!isTestUser) {
        setIsDemoMode(false);
        return;
      }

      try {
        await api.get('/menu', { timeout: 3000 });
        setIsDemoMode(false);
      } catch (error) {
        setIsDemoMode(true);
      }
    };

    checkBackendConnection();
  }, []);

  const pickupLocations = [
    { id: 'main-canteen', name: 'Main Canteen', time: '10-15 mins' },
  ];

  // Calculate totals (only for available items)
  const availableItems = cartItems.filter(item => !item.isUnavailable);
  const subtotal = availableItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const extraCharges = 0; // No extra charges for now
  const total = subtotal + extraCharges;

  const handleCheckout = async () => {
    // Filter out unavailable items
    const availableItems = cartItems.filter(item => !item.isUnavailable);

    if (availableItems.length === 0) {
      alert('No available items in cart to checkout');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        items: availableItems,
        pickupLocation: selectedPickupLocation,
        subtotal,
        extraCharges,
        total,
        paymentMethod: 'online'
      };

      const newOrder = await placeOrder(orderData);
      clearCart();

      // Redirect to order tracking page
      if (newOrder && (newOrder.id || newOrder._id)) {
        const orderId = newOrder.id || newOrder._id;
        navigate(`/order/${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedLocation = pickupLocations.find(loc => loc.id === selectedPickupLocation);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

      {/* Demo Mode Warning */}
      {isDemoMode && (
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900 mb-1">
                🧪 Demo Mode - Backend on Cold Start
              </p>
              <p className="text-xs text-yellow-800">
                Backend server is not connected or starting up. This order will be simulated for demonstration purposes only. 
                No actual payment will be processed and no real order will be placed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">
              {isDemoMode ? 'Simulated Payment' : 'UPI/Gateway Payment'}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {isDemoMode 
              ? 'Payment simulation for demo purposes. No actual transaction will occur.'
              : 'Secure online payment via UPI or payment gateway. Order will be confirmed after successful payment.'
            }
          </p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({cartItems.length} items)</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Extra Charges</span>
          <span>₹{extraCharges.toFixed(2)}</span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-6">
        <div className={`p-3 border rounded-lg ${isDemoMode ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-sm flex items-center ${isDemoMode ? 'text-orange-700' : 'text-green-700'}`}>
            <span className="mr-2">{isDemoMode ? '⚠️' : '✅'}</span>
            {isDemoMode 
              ? 'Demo order will be created instantly. No actual preparation or pickup.'
              : 'Order preparation starts after payment confirmation. Pickup: 10-15 mins after payment.'
            }
          </p>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={cartItems.length === 0 || isProcessing}
        className={`w-full py-3 sm:py-4 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation ${cartItems.length === 0 || isProcessing
          ? 'bg-gray-300 cursor-not-allowed'
          : isDemoMode
            ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-lg hover:shadow-xl'
            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-lg hover:shadow-xl'
          }`}
      >
        <CreditCard className="h-5 w-5" />
        <span className="text-sm sm:text-base">
          {isProcessing 
            ? 'Processing...' 
            : isDemoMode 
              ? `Simulate Order ₹${total.toFixed(2)}`
              : `Checkout ₹${total.toFixed(2)}`
          }
        </span>
      </button>

      {/* Payment Info */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          {isDemoMode ? '🧪 Demo mode - No real payment' : '🔒 Secure payment via UPI/Gateway'}
        </p>
      </div>
    </div>
  );
};

export default CheckoutSummary;