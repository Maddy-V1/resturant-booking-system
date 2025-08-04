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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl rounded-2xl mb-8">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <span className="mr-3">🍽️</span>
                  Menu Management
                </h1>
                <p className="text-green-100 text-lg">
                  Manage your menu items, set daily deals, and control availability
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDealSelector(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
                >
                  <span className="mr-2">⭐</span>
                  Manage Deals
                </button>
                <button
                  onClick={handleAddItem}
                  className="bg-white text-green-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
                >
                  <span className="mr-2">➕</span>
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
        <div className="bg-white shadow-xl rounded-2xl">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📋</span>
                Menu Items ({menuItems.length})
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Paused</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Deal of Day</span>
                </div>
              </div>
            </div>
          </div>
          
          {menuItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No menu items yet</h3>
              <p className="text-gray-500 mb-6">Add your first item to get started with your menu</p>
              <button
                onClick={handleAddItem}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors duration-200"
              >
                Add First Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
              {menuItems.map((item) => (
                <div key={item._id} className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
                  !item.available 
                    ? 'bg-gray-50 border-gray-200 opacity-75' 
                    : item.isDealOfDay 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' 
                      : 'bg-white border-gray-200 hover:border-green-300'
                }`}>
                  {/* Item Header */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>
                          {item.name}
                          {!item.available && <span className="ml-2 text-sm font-normal">(Paused)</span>}
                        </h3>
                        <p className={`text-sm leading-relaxed ${item.available ? 'text-gray-600' : 'text-gray-400'}`}>
                          {item.description}
                        </p>
                      </div>
                      {item.isDealOfDay && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          ⭐ DEAL!
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                          item.type === 'packaged' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.type === 'packaged' ? '📦 Packaged' : '🔥 Live'}
                        </span>
                      </div>
                      
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        item.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available ? '✅ Available' : '⏸️ Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6">
                    {item.isDealOfDay && item.dealPrice ? (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              ₹{item.dealPrice}
                            </div>
                            <div className="text-sm text-gray-500 line-through">
                              Regular: ₹{item.price}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-700">
                              Save ₹{item.price - item.dealPrice}
                            </div>
                            <div className="text-xs text-green-600">
                              {Math.round(((item.price - item.dealPrice) / item.price) * 100)}% OFF
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className={`text-3xl font-bold ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>
                          ₹{item.price}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
                    >
                      <span className="mr-1">✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(item._id, item.available)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center justify-center ${
                        item.available
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      <span className="mr-1">{item.available ? '⏸️' : '▶️'}</span>
                      {item.available ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
                    >
                      <span className="mr-1">🗑️</span>
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