import React, { useState } from 'react';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const OrderCart = ({ cart, onUpdateItem, onRemoveItem, onClearCart, onClose, totalAmount }) => {
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    onUpdateItem(itemId, newQuantity);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setIsPlacingOrder(true);
    setError(null);

    try {
      const orderData = {
        items: cart.map(item => ({
          itemId: item._id,
          name: item.name,
          price: item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price,
          quantity: item.quantity
        })),
        paymentMethod,
        totalAmount
      };

      const response = await api.post('/orders', orderData);
      
      // Clear cart and close modal
      onClearCart();
      onClose();
      
      // Redirect to order tracking page
      const orderId = response.data.data._id;
      window.location.href = `/order/${orderId}`;
      
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Your Cart</h2>
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Order</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            {cart.map(item => {
              const itemPrice = item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price;
              const itemTotal = itemPrice * item.quantity;
              
              return (
                <div key={item._id} className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-green-600 font-medium">₹{itemPrice.toFixed(2)}</span>
                      {item.isDealOfDay && item.dealPrice && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          Deal!
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[2.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right min-w-[4rem]">
                      <div className="font-semibold">₹{itemTotal.toFixed(2)}</div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem(item._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total Amount:</span>
              <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <div>
                  <span>Online Payment</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Order will be immediately added to preparation queue
                  </p>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="offline"
                  checked={paymentMethod === 'offline'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <div>
                  <span>Pay at Counter (Cash)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Order will be added to preparation queue after payment confirmation by staff
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Customer Info Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Order Details</h3>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>WhatsApp:</strong> {user?.whatsapp}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClearCart}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isPlacingOrder}
            >
              Clear Cart
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || cart.length === 0}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                isPlacingOrder
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPlacingOrder ? 'Placing Order...' : `Place Order (₹${totalAmount.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCart;