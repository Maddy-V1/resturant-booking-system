import React from 'react';
import { Plus, Minus } from 'lucide-react';

const QuantitySelector = ({ 
  quantity, 
  onQuantityChange, 
  min = 0, 
  max = 99, 
  size = 'md',
  disabled = false 
}) => {
  const handleDecrease = () => {
    if (quantity > min && !disabled) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max && !disabled) {
      onQuantityChange(quantity + 1);
    }
  };

  const sizeClasses = {
    sm: {
      button: 'w-6 h-6',
      icon: 'h-3 w-3',
      text: 'text-sm w-8'
    },
    md: {
      button: 'w-8 h-8',
      icon: 'h-4 w-4',
      text: 'text-base w-12'
    },
    lg: {
      button: 'w-10 h-10',
      icon: 'h-5 w-5',
      text: 'text-lg w-16'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex items-center justify-center space-x-3">
      <button
        onClick={handleDecrease}
        disabled={quantity <= min || disabled}
        className={`${currentSize.button} rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-400`}
      >
        <Minus className={currentSize.icon} />
      </button>
      
      <span className={`${currentSize.text} text-center font-semibold text-gray-900`}>
        {quantity}
      </span>
      
      <button
        onClick={handleIncrease}
        disabled={quantity >= max || disabled}
        className={`${currentSize.button} rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-400`}
      >
        <Plus className={currentSize.icon} />
      </button>
    </div>
  );
};

export default QuantitySelector;