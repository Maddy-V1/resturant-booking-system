import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';

const CheckoutSummary = ({ cartItems }) => {
  const [selectedPickupLocation, setSelectedPickupLocation] = useState('main-canteen');
  const [isProcessing, setIsProcessing] = useState(false);
  const { placeOrder, clearCart } = useOrder();
  const navigate = useNavigate();

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



      {/* Payment Method */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">UPI/Gateway Payment</span>
          </div>
          <p className="text-sm text-blue-700">
            Secure online payment via UPI or payment gateway. Order will be confirmed after successful payment.
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
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 flex items-center">
            <span className="mr-2">✅</span>
            Order preparation starts after payment confirmation. Pickup: 10-15 mins after payment.
          </p>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={cartItems.length === 0 || isProcessing}
        className={`w-full py-3 sm:py-4 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation ${cartItems.length === 0 || isProcessing
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-lg hover:shadow-xl'
          }`}
      >
        <CreditCard className="h-5 w-5" />
        <span className="text-sm sm:text-base">
          {isProcessing ? 'Processing...' : `Checkout ₹${total.toFixed(2)}`}
        </span>
      </button>

      {/* Payment Info */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          🔒 Secure payment via UPI/Gateway
        </p>
      </div>
    </div>
  );
};

export default CheckoutSummary;