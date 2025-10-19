import React, { useState, useEffect } from 'react';
import { Plus, Minus, Star, Clock, Flame, Sparkles } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';

const MenuItemCard = ({ item }) => {
  const [quantity, setQuantity] = useState(0);
  const { cartItems, addToCart, updateCartItemQuantity } = useOrder();

  // Check if item is already in cart and sync quantity
  useEffect(() => {
    const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (cartItem) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(0);
    }
  }, [cartItems, item.id]);

  const handleAddToCart = () => {
    const newQuantity = 1;
    setQuantity(newQuantity);
    addToCart({
      ...item,
      quantity: newQuantity
    });
  };

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(0, quantity + change);
    setQuantity(newQuantity);

    if (newQuantity === 0) {
      // Remove from cart
      updateCartItemQuantity(item.id, 0);
    } else {
      // Update quantity in cart
      updateCartItemQuantity(item.id, newQuantity);
    }
  };

  const discountAmount = item.originalPrice ? item.originalPrice - item.price : 0;
  const discountPercentage = item.originalPrice ? Math.round((discountAmount / item.originalPrice) * 100) : 0;

  // Get actual food image - use provided imageUrl or fallback to name-based image
  const getFoodImage = (name, imageUrl) => {
    // If imageUrl is provided and not empty, use it
    if (imageUrl && imageUrl.trim()) {
      return imageUrl;
    }
    
    // Fallback to name-based images
    const lowerName = name.toLowerCase();
    if (lowerName.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=400&fit=crop';
    if (lowerName.includes('dosa')) return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop';
    if (lowerName.includes('paneer')) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop';
    if (lowerName.includes('samosa')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop';
    if (lowerName.includes('lassi')) return 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop';
    if (lowerName.includes('chole') || lowerName.includes('bhature')) return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop';
    if (lowerName.includes('thali')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop';
    if (lowerName.includes('chicken')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=400&fit=crop';
    if (lowerName.includes('paratha') || lowerName.includes('aloo')) return 'https://images.unsplash.com/photo-1574653853027-5d3ba0c29896?w=400&h=400&fit=crop';
    if (lowerName.includes('rajma') || lowerName.includes('rice')) return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=400&fit=crop';
    if (lowerName.includes('pav') || lowerName.includes('bhaji')) return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop';
    if (lowerName.includes('gulab') || lowerName.includes('jamun')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop';
    if (lowerName.includes('butter')) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop';
    if (lowerName.includes('lays') || lowerName.includes('chips')) return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop';
    if (lowerName.includes('coca') || lowerName.includes('cola') || lowerName.includes('coke')) return 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop';
    if (lowerName.includes('brownie')) return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop';
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop'; // Default food image
  };

  // Get rating (mock data for demo)
  const getRating = () => (4.0 + Math.random() * 1).toFixed(1);
  
  // Get prep time (mock data for demo)
  const getPrepTime = () => Math.floor(Math.random() * 20) + 10;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group border border-orange-100 hover:border-orange-300 transform hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden">
      {/* Compact Image Container */}
      <div className="relative">
        <div className="aspect-[5/3] rounded-t-xl overflow-hidden relative">
          <img 
            src={getFoodImage(item.name, item.imageUrl)}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent"></div>
          
          {/* Top badges row */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs font-semibold text-gray-900">{getRating()}</span>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <Clock className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">{getPrepTime()}m</span>
            </div>
          </div>

          {/* Bottom badges row */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
            <div className="flex flex-col space-y-1">
              {item.isDealOfDay && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                  <Flame className="h-3 w-3" />
                  <span>DEAL</span>
                </div>
              )}
              {item.sometimes && (
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>SOMETIMES</span>
                </div>
              )}
            </div>
            {item.originalPrice && discountPercentage > 0 && (
              <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {discountPercentage}% OFF
              </div>
            )}
          </div>

          {/* Availability overlay */}
          {!item.available && (
            <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Out of Stock
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Content */}
      <div className="p-3 space-y-2">
        {/* Title and Price Row */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                {item.description}
              </p>
            )}
          </div>
          
          {/* Price Section */}
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-gray-900">
              ₹{item.price}
            </span>
            {item.originalPrice && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 line-through">
                  ₹{item.originalPrice}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  ₹{discountAmount} off
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Add to Cart Button or Quantity Controls */}
        {quantity === 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={!item.available}
            className="w-full py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 text-white shadow-lg hover:shadow-xl touch-manipulation text-sm disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            style={{ 
              background: item.available 
                ? 'linear-gradient(135deg, #FF6B00 0%, #FF8500 100%)' 
                : '#9CA3AF' 
            }}
          >
            <Plus className="h-4 w-4" />
            <span>ADD TO CART</span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-2 border border-orange-200">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation transform hover:scale-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8500 100%)' }}
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="text-center px-3">
              <span className="text-sm font-bold text-gray-900 select-none block">
                {quantity}
              </span>
              <span className="text-xs text-gray-600">in cart</span>
            </div>

            <button
              onClick={() => handleQuantityChange(1)}
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation transform hover:scale-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8500 100%)' }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;