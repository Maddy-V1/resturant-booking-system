import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';

const MenuItemForm = ({ item, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    type: 'packaged',
    available: true,
    sometimes: false,
    isDealOfDay: false,
    dealPrice: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState('');



  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        imageUrl: item.imageUrl || '',
        type: item.type || 'packaged',
        available: item.available !== undefined ? item.available : true,
        sometimes: item.sometimes || false,
        isDealOfDay: item.isDealOfDay || false,
        dealPrice: item.dealPrice?.toString() || ''
      });
      setImagePreview(item.imageUrl || '');
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Update image preview when imageUrl changes
    if (name === 'imageUrl') {
      setImagePreview(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return;
    }
    if (!formData.type) {
      setError('Item type is required');
      return;
    }
    
    // Deal validation
    if (formData.isDealOfDay) {
      if (!formData.dealPrice || isNaN(formData.dealPrice) || parseFloat(formData.dealPrice) <= 0) {
        setError('Deal price is required when setting as deal of the day');
        return;
      }
      if (parseFloat(formData.dealPrice) >= parseFloat(formData.price)) {
        setError('Deal price must be less than regular price');
        return;
      }
    }

    try {
      setLoading(true);

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl.trim(),
        type: formData.type,
        available: formData.available,
        sometimes: formData.sometimes,
        isDealOfDay: formData.isDealOfDay
      };
      
      // Add deal price if it's a deal of the day
      if (formData.isDealOfDay && formData.dealPrice) {
        submitData.dealPrice = parseFloat(formData.dealPrice);
      }

      if (item) {
        // Update existing item
        await api.put(`/menu/${item._id}`, submitData);
      } else {
        // Create new item
        await api.post('/menu', submitData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving menu item:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save menu item';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="mr-3">🍽️</span>
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {item ? 'Update your menu item details' : 'Create a new item for your menu'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-lg py-3 px-4"
                placeholder="e.g., Chicken Biryani"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-lg py-3 px-4"
                placeholder="e.g., 120"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 py-3 px-4"
              placeholder="Describe your dish... e.g., Spicy chicken biryani with basmati rice and aromatic spices"
            />
          </div>
        </div>

        {/* Image Section */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📸</span>
            Item Photo
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 px-4"
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-2 text-sm text-gray-600">
                💡 Tip: You can find free food images on Unsplash.com
              </p>
            </div>
            
            {/* Image Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Preview
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className={`${imagePreview ? 'hidden' : 'block'} text-gray-500`}>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">No image selected</p>
                  <p className="text-xs text-gray-400">Add an image URL above to see preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Item Settings Section */}
        <div className="bg-yellow-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚙️</span>
            Item Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Food Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-yellow-500 focus:border-yellow-500 py-3 px-4"
              >
                <option value="packaged">📦 Packaged Food (Ready to serve)</option>
                <option value="live">🔥 Live Food (Needs cooking)</option>
              </select>
              <p className="mt-2 text-sm text-gray-600">
                {formData.type === 'packaged' 
                  ? '✅ Ready to eat - served immediately' 
                  : '⏰ Needs preparation time - customers will wait'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  name="available"
                  checked={formData.available}
                  onChange={handleChange}
                  className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="available" className="ml-3 block text-sm font-medium text-gray-900">
                  ✅ Available for ordering
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sometimes"
                  name="sometimes"
                  checked={formData.sometimes}
                  onChange={handleChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="sometimes" className="ml-3 block text-sm font-medium text-gray-900">
                  ⭐ Sometimes Available (Special item)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Deal of the Day Section */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔥</span>
            Deal of the Day
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDealOfDay"
                name="isDealOfDay"
                checked={formData.isDealOfDay}
                onChange={handleChange}
                className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isDealOfDay" className="ml-3 block text-sm font-medium text-gray-900">
                🔥 Set as Deal of the Day
              </label>
            </div>

            {formData.isDealOfDay && (
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <label htmlFor="dealPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Price (₹) *
                </label>
                <input
                  type="number"
                  id="dealPrice"
                  name="dealPrice"
                  min="0"
                  step="0.01"
                  max={formData.price ? parseFloat(formData.price) - 1 : 999}
                  value={formData.dealPrice}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 py-3 px-4"
                  placeholder="Enter special deal price"
                />
                {formData.price && formData.dealPrice && (
                  <div className="mt-2 text-sm text-green-600">
                    💰 Customer saves: ₹{parseFloat(formData.price) - parseFloat(formData.dealPrice || 0)} 
                    ({Math.round(((parseFloat(formData.price) - parseFloat(formData.dealPrice || 0)) / parseFloat(formData.price)) * 100)}% OFF)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200 flex items-center justify-center"
            >
              <span className="mr-2">❌</span>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="mr-2">{item ? '💾' : '➕'}</span>
                  {item ? 'Update Item' : 'Add Item'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MenuItemForm;