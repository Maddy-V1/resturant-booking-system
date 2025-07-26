import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';

const DealOfDaySelector = ({ menuItems, onSuccess, onCancel }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [dealPrices, setDealPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize with current deal items
    const currentDeals = menuItems.filter(item => item.isDealOfDay);
    setSelectedItems(currentDeals.map(item => item._id));
    
    const prices = {};
    currentDeals.forEach(item => {
      if (item.dealPrice) {
        prices[item._id] = item.dealPrice.toString();
      }
    });
    setDealPrices(prices);
  }, [menuItems]);

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        // Remove from selection and clear deal price
        const newPrices = { ...dealPrices };
        delete newPrices[itemId];
        setDealPrices(newPrices);
        return prev.filter(id => id !== itemId);
      } else {
        // Add to selection
        return [...prev, itemId];
      }
    });
  };

  const handlePriceChange = (itemId, price) => {
    setDealPrices(prev => ({
      ...prev,
      [itemId]: price
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate deal prices
    for (const itemId of selectedItems) {
      const dealPrice = dealPrices[itemId];
      const originalItem = menuItems.find(item => item._id === itemId);
      
      if (!dealPrice || isNaN(dealPrice) || parseFloat(dealPrice) <= 0) {
        setError(`Please enter a valid deal price for ${originalItem?.name}`);
        return;
      }
      
      if (parseFloat(dealPrice) >= originalItem.price) {
        setError(`Deal price for ${originalItem?.name} must be less than the original price (₹${originalItem.price})`);
        return;
      }

      // Additional validation: deal price should be reasonable (at least 5% discount)
      const discountPercentage = ((originalItem.price - parseFloat(dealPrice)) / originalItem.price) * 100;
      if (discountPercentage < 5) {
        setError(`Deal price for ${originalItem?.name} should offer at least 5% discount (current: ${discountPercentage.toFixed(1)}%)`);
        return;
      }
    }

    try {
      setLoading(true);

      // Update each menu item individually to better handle errors
      for (const item of menuItems) {
        const isSelected = selectedItems.includes(item._id);
        const dealPrice = isSelected ? parseFloat(dealPrices[item._id]) : null;

        const updateData = {
          name: item.name,
          description: item.description,
          price: item.price,
          available: item.available,
          isDealOfDay: isSelected
        };

        // Only include dealPrice if item is selected as deal of day
        if (isSelected && dealPrice) {
          updateData.dealPrice = dealPrice;
        }

        try {
          await api.put(`/menu/${item._id}`, updateData);
        } catch (itemError) {
          console.error(`Error updating item ${item.name}:`, itemError);
          throw new Error(`Failed to update ${item.name}: ${itemError.response?.data?.error?.message || itemError.message}`);
        }
      }
      onSuccess();
    } catch (error) {
      console.error('Error updating deals:', error);
      let errorMessage = 'Failed to update deals';
      
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid deal data. Please check that deal prices are less than regular prices.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Deal of the Day</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          Select items to feature as today's deals and set special pricing. Deal prices must be lower than the original price.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {menuItems.filter(item => item.available).map((item) => (
            <div key={item._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={`deal-${item._id}`}
                  checked={selectedItems.includes(item._id)}
                  onChange={() => handleItemToggle(item._id)}
                  className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor={`deal-${item._id}`} className="block">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <p className="text-sm text-gray-500 mt-1">Original Price: ₹{item.price}</p>
                      </div>
                      {selectedItems.includes(item._id) && (
                        <div className="ml-4">
                          <label htmlFor={`price-${item._id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Deal Price (₹)
                          </label>
                          <input
                            type="number"
                            id={`price-${item._id}`}
                            min="0"
                            max={item.price - 1}
                            step="0.01"
                            value={dealPrices[item._id] || ''}
                            onChange={(e) => handlePriceChange(item._id, e.target.value)}
                            className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {menuItems.filter(item => item.available).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No available menu items to set as deals.</p>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Deals'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealOfDaySelector;