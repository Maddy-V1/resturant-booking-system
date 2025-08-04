import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Trash2, Plus, Minus } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';

const SwiggyFloatingCart = () => {
  const { cartItems, getCartItemCount, getCartTotal, updateCartItemQuantity } = useOrder();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const navigate = useNavigate();
  
  const itemCount = getCartItemCount();
  const total = getCartTotal();

  // Show/hide cart based on items
  useEffect(() => {
    if (itemCount > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
    }
  }, [itemCount]);

  // Auto-collapse after 4 seconds when expanded
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);



  const handleQuantityChange = (itemId, change) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + change);
      updateCartItemQuantity(itemId, newQuantity);
    }
  };

  // Handle click to toggle expanded view
  const handleCartClick = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Expanded Cart Items - Positioned separately to not affect button */}
      {isExpanded && (
        <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 max-w-sm mx-4 max-h-80 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
              <h3 className="font-semibold text-gray-900">Cart Items</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="max-h-48 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-orange-600 truncate">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(0)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    
                    <span className="text-sm font-semibold text-gray-900 w-6 text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Compact Black & White Checkout Footer */}
            <div className="p-2 bg-gray-900 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  navigate('/cart');
                }}
                className="w-full py-1.5 bg-white text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-xs font-medium flex items-center justify-center space-x-1"
              >
                <ShoppingCart className="h-3 w-3" />
                <span>Checkout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button - Always centered */}
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div
          onClick={handleCartClick}
          className={`group relative bg-white text-gray-900 px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-opacity duration-300 w-44 border border-gray-200 hover:border-orange-300 cursor-pointer select-none ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            touchAction: 'manipulation'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <div>
                <div className="font-semibold text-xs text-gray-900">
                  {itemCount} item{itemCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-sm text-gray-900">₹{total.toFixed(0)}</div>
            </div>
          </div>

          {/* Subtle hover effect */}
          <div className="absolute inset-0 bg-orange-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-200"></div>
        </div>
      </div>
    </>
  );
};

export default SwiggyFloatingCart;