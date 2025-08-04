import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { useOrder } from '../context/OrderContext';
import CartItemCard from '../components/cart/CartItemCard';
import CheckoutSummary from '../components/cart/CheckoutSummary';

const CartPage = () => {
  const { cartItems } = useOrder();
  const [isVisible, setIsVisible] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(15);

  useEffect(() => {
    setIsVisible(true);
    // Calculate estimated time based on cart items
    const baseTime = 10;
    const itemTime = cartItems.length * 2;
    setEstimatedTime(baseTime + itemTime);
  }, [cartItems]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        {/* Enhanced Mobile Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-10 shadow-sm">
          <div className="px-4 py-4">
            <Link
              to="/"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-all duration-200 mb-3 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back to Menu</span>
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Empty Cart */}
        <div className={`px-4 py-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-orange-100">
            {/* Animated Cart Icon */}
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <ShoppingCart className="h-10 w-10 text-orange-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">0</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Looks like you haven't added any delicious items yet.<br />
              Let's fix that! 🍽️
            </p>
            
            {/* Enhanced CTA Button */}
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Explore Menu
            </Link>
            
            {/* Quick suggestions */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3">Popular right now:</p>
              <div className="flex justify-center space-x-4 text-xs">
                <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full">🍛 Biryani</span>
                <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full">🥪 Sandwiches</span>
                <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full">🥤 Beverages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Enhanced Mobile Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-all duration-200 mb-3 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Back to Menu</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
              <p className="text-sm text-gray-600">{totalItems} items • ₹{totalValue}</p>
            </div>
            
            {/* Cart Summary Badge */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full">
              <span className="text-sm font-bold">{cartItems.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Delivery Time Estimate */}
        <div className={`bg-white rounded-2xl p-4 mb-4 shadow-lg border border-orange-100 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Estimated Delivery</p>
                <p className="text-sm text-gray-600">{estimatedTime}-{estimatedTime + 5} minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Fast</span>
            </div>
          </div>
        </div>

        {/* Cart Items with staggered animation */}
        <div className="space-y-3 mb-4">
          {cartItems.map((item, index) => (
            <div
              key={item.id}
              className={`transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CartItemCard item={item} />
            </div>
          ))}
        </div>

        {/* Enhanced Checkout Summary */}
        <div className={`transform transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <CheckoutSummary cartItems={cartItems} />
        </div>

        {/* Continue Shopping with better styling */}
        <div className={`mt-6 text-center transform transition-all duration-700 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link
            to="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-all duration-200 text-sm font-medium group bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Add More Items
          </Link>
        </div>

        {/* Trust indicators */}
        <div className={`mt-6 grid grid-cols-3 gap-3 transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <div className="text-green-500 text-lg mb-1">🔒</div>
            <p className="text-xs text-gray-600 font-medium">Secure Payment</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <div className="text-blue-500 text-lg mb-1">⚡</div>
            <p className="text-xs text-gray-600 font-medium">Quick Delivery</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <div className="text-yellow-500 text-lg mb-1">⭐</div>
            <p className="text-xs text-gray-600 font-medium">Quality Food</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;