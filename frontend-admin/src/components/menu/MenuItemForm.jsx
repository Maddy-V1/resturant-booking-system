import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';

const MenuItemForm = ({ item, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        available: item.available !== undefined ? item.available : true
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

    try {
      setLoading(true);
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        available: formData.available
      };

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {item ? 'Edit Menu Item' : 'Add New Menu Item'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Item Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter item name"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter item description"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
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
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter price"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="available"
            name="available"
            checked={formData.available}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
            Available for ordering
          </label>
        </div>

        <div className="flex justify-end space-x-4">
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuItemForm;