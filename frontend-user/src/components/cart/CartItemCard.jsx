import React, { useState } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';

const CartItemCard = ({ item }) => {
  const { updateCartItemQuantity, removeFromCart } = useOrder();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(0, item.quantity + change);
    if (newQuantity === 0) {
      handleRemoveItem();
    } else {
      updateCartItemQuantity(item.id, newQuantity);
    }
  };

  const handleRemoveItem = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeFromCart(item.id);
    }, 300);
  };

  const itemTotal = item.price * item.quantity;
  const discountAmount = item.originalPrice ? item.originalPrice - item.price : 0;

  // Get actual food image based on item name or category
  const getFoodImage = (name) => {
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
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop'; // Default food image
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden transition-all duration-300 hover:shadow-xl ${isRemoving ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Enhanced Item Image */}
          <div className="flex-shrink-0 relative">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 shadow-md">
              <img
                src={getFoodImage(item.name)}
                alt={item.name}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            {/* Quantity badge on image */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">{item.quantity}</span>
            </div>
          </div>

          {/* Enhanced Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
              
              {/* Remove button */}
              <button
                onClick={handleRemoveItem}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 ml-2 group"
                title="Remove item"
              >
                <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>

            {/* Price and badges row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  ₹{item.price}
                </span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ₹{item.originalPrice}
                  </span>
                )}
                {discountAmount > 0 && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                    ₹{discountAmount} off
                  </span>
                )}
              </div>
              
              {/* Item total */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ₹{itemTotal}
                </div>
                {item.quantity > 1 && (
                  <div className="text-xs text-gray-500">
                    {item.quantity} × ₹{item.price}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {item.isDealOfDay && (
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    🔥 DEAL
                  </span>
                )}
              </div>
              
              <div className="flex items-center bg-gray-50 rounded-xl p-1">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg touch-manipulation"
                >
                  <Minus className="h-3 w-3" />
                </button>

                <span className="text-sm font-bold text-gray-900 px-4 select-none">
                  {item.quantity}
                </span>

                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg touch-manipulation"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;