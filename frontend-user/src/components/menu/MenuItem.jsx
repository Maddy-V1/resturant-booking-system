import React, { useState } from 'react';

const MenuItem = ({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await onAddToCart(item, quantity);
    
    // Show brief feedback
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1); // Reset quantity after adding
    }, 500);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const displayPrice = item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price;
  const originalPrice = item.price;
  const isOnSale = item.isDealOfDay && item.dealPrice && item.dealPrice < item.price;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Deal of the Day Badge */}
        {item.isDealOfDay && (
          <div className="mb-3">
            <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Deal of the Day!
            </span>
          </div>
        )}

        {/* Item Name */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {item.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-4 text-sm">
          {item.description}
        </p>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-green-600">
              ₹{displayPrice.toFixed(2)}
            </span>
            {isOnSale && (
              <span className="text-lg text-gray-500 line-through">
                ₹{originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          {isOnSale && (
            <p className="text-sm text-red-600 font-medium">
              Save ₹{(originalPrice - displayPrice).toFixed(2)}
            </p>
          )}
        </div>

        {/* Availability Status */}
        {!item.available && (
          <div className="mb-4">
            <span className="inline-block bg-gray-500 text-white text-sm px-3 py-1 rounded-full">
              Currently Unavailable
            </span>
          </div>
        )}

        {/* Quantity Selector and Add to Cart */}
        {item.available && (
          <div className="flex items-center justify-between">
            {/* Quantity Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Qty:</span>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={decrementQuantity}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAdding
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAdding ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        )}

        {/* Unavailable Message */}
        {!item.available && (
          <div className="text-center">
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              Currently Unavailable
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItem;