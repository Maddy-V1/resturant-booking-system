import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import MenuItemForm from './MenuItemForm';
import DealOfDaySelector from './DealOfDaySelector';

const MenuManager = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDealSelector, setShowDealSelector] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      // Fetch all menu items (including unavailable ones) for admin management
      const response = await api.get('/menu?includeUnavailable=true');
      setMenuItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowAddForm(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await api.delete(`/menu/${itemId}`);
      await fetchMenuItems(); // Refresh the list
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setError('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (itemId, currentAvailability) => {
    try {
      await api.put(`/menu/${itemId}/toggle`);
      await fetchMenuItems(); // Refresh the list
    } catch (error) {
      console.error('Error toggling availability:', error);
      setError('Failed to update item availability');
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingItem(null);
    fetchMenuItems();
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-gray-600 mt-1">Manage your menu items and daily deals</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDealSelector(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                >
                  Manage Deals
                </button>
                <button
                  onClick={handleAddItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add New Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
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

        {/* Menu Items Grid */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Menu Items ({menuItems.length})</h2>
          </div>
          
          {menuItems.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No menu items found. Add your first item to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {menuItems.map((item) => (
                <div key={item._id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                  !item.available ? 'bg-gray-50 opacity-75' : 'bg-white'
                }`}>
                  {/* Item Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>
                        {item.name}
                        {!item.available && <span className="ml-2 text-xs">(Paused)</span>}
                      </h3>
                      <p className={`text-sm mt-1 ${item.available ? 'text-gray-600' : 'text-gray-400'}`}>
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      {item.isDealOfDay && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Deal!
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available ? 'Available' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    {item.isDealOfDay && item.dealPrice ? (
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${item.available ? 'text-green-600' : 'text-gray-400'}`}>
                          ₹{item.dealPrice}
                        </span>
                        <span className={`text-sm line-through ${item.available ? 'text-gray-500' : 'text-gray-400'}`}>
                          ₹{item.price}
                        </span>
                      </div>
                    ) : (
                      <span className={`text-lg font-bold ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>
                        ₹{item.price}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(item._id, item.available)}
                      className={`px-3 py-1 rounded text-sm ${
                        item.available
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {item.available ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <MenuItemForm
                item={editingItem}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {/* Deal Selector Modal */}
        {showDealSelector && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <DealOfDaySelector
                menuItems={menuItems}
                onSuccess={() => {
                  setShowDealSelector(false);
                  fetchMenuItems();
                }}
                onCancel={() => setShowDealSelector(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManager;