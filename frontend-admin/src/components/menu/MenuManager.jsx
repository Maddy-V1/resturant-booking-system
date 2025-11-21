import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter menu items based on search query
  const getFilteredMenuItems = () => {
    if (!searchQuery.trim()) {
      return menuItems;
    }

    const query = searchQuery.toLowerCase().trim();
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      (item.isDealOfDay && 'deal'.includes(query)) ||
      (item.sometimes && 'special'.includes(query))
    );
  };

  const filteredMenuItems = getFilteredMenuItems();

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
          <div className="px-6 py-6 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start">
                  <span className="mr-3">🍽️</span>
                  Menu Management
                </h1>
                <p className="text-green-100 text-lg">
                  Manage your menu items, set daily deals, and control availability
                </p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                <button
                  onClick={() => setShowDealSelector(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  <span className="mr-2">⭐</span>
                  Manage Deals
                </button>
                <button
                  onClick={handleAddItem}
                  className="bg-white text-green-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
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

        {/* Menu Items Segmented (Live vs Packaged) */}
        <div className="bg-white shadow-xl rounded-2xl">
          <div className="px-6 py-6 md:px-8 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-2 md:space-y-0">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📋</span>
                Menu Items ({filteredMenuItems.length}{searchQuery.trim() ? ` of ${menuItems.length}` : ''})
              </h2>
              <div className="text-sm text-gray-600">Segmented: 🔥 Live • 📦 Ready to Eat</div>
            </div>

            {/* Search Bar */}
            <div className="w-full md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredMenuItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery.trim() ? 'No items found' : 'No menu items yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery.trim()
                  ? `No items found for "${searchQuery}". Try a different search term.`
                  : 'Add your first item to get started with your menu'
                }
              </p>
              {searchQuery.trim() ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-gray-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors duration-200 mr-3"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={handleAddItem}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  Add First Item
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 space-y-10">
              {/* Live Section */}
              {filteredMenuItems.filter(i => i.type === 'live').length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <span className="text-xl mr-2">🔥</span>
                    <h3 className="text-lg font-bold text-gray-900">Live Fresh Food</h3>
                    <span className="text-sm text-gray-500 ml-2">({filteredMenuItems.filter(i => i.type === 'live').length})</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-red-200 to-transparent ml-4"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...filteredMenuItems.filter(i => i.type === 'live')]
                      .sort((a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name))
                      .map((item) => (
                        <div
                          key={item._id}
                          className={`border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl ${item.available ? 'bg-white' : 'bg-gray-50'} ${item.available ? '' : 'opacity-70'} ${item.available ? '' : 'grayscale'}`}
                        >
                          {/* Image */}
                          <div className="relative h-32 overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`${item.imageUrl ? 'hidden' : 'flex'} w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center`}>
                              <div className="text-center text-gray-400">
                                <div className="text-3xl mb-1">🍽️</div>
                                <p className="text-xs">No image</p>
                              </div>
                            </div>
                            {item.isDealOfDay && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">DEAL</div>
                            )}
                            {item.sometimes && (
                              <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">SPECIAL</div>
                            )}
                          </div>

                          {/* Content - compact (no type/status rows) */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 pr-3">
                                <h3 className={`font-bold text-sm truncate ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>{item.name}</h3>
                                <p className={`text-xs line-clamp-1 ${item.available ? 'text-gray-600' : 'text-gray-400'}`}>{item.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-gray-900">₹{item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price}</div>
                                {item.isDealOfDay && item.dealPrice && (
                                  <div className="text-[11px] text-gray-500 line-through">₹{item.price}</div>
                                )}
                              </div>
                            </div>

                            {/* Actions - tighter spacing */}
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleToggleAvailability(item._id, item.available)}
                                className={`${item.available ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-2 rounded-lg text-xs font-medium transition`}
                              >
                                {item.available ? '⏸️ Pause' : '▶️ Start'}
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Packaged Section */}
              {filteredMenuItems.filter(i => i.type === 'packaged').length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <span className="text-xl mr-2">📦</span>
                    <h3 className="text-lg font-bold text-gray-900">Ready to Eat</h3>
                    <span className="text-sm text-gray-500 ml-2">({filteredMenuItems.filter(i => i.type === 'packaged').length})</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent ml-4"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...filteredMenuItems.filter(i => i.type === 'packaged')]
                      .sort((a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name))
                      .map((item) => (
                        <div
                          key={item._id}
                          className={`border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl ${item.available ? 'bg-white' : 'bg-gray-50'} ${item.available ? '' : 'opacity-70'} ${item.available ? '' : 'grayscale'}`}
                        >
                          {/* Image */}
                          <div className="relative h-32 overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`${item.imageUrl ? 'hidden' : 'flex'} w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center`}>
                              <div className="text-center text-gray-400">
                                <div className="text-3xl mb-1">🍽️</div>
                                <p className="text-xs">No image</p>
                              </div>
                            </div>
                            {item.isDealOfDay && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">DEAL</div>
                            )}
                            {item.sometimes && (
                              <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">SPECIAL</div>
                            )}
                          </div>

                          {/* Content - compact (no type/status rows) */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 pr-3">
                                <h3 className={`font-bold text-sm truncate ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>{item.name}</h3>
                                <p className={`text-xs line-clamp-1 ${item.available ? 'text-gray-600' : 'text-gray-400'}`}>{item.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-gray-900">₹{item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price}</div>
                                {item.isDealOfDay && item.dealPrice && (
                                  <div className="text-[11px] text-gray-500 line-through">₹{item.price}</div>
                                )}
                              </div>
                            </div>

                            {/* Actions - tighter spacing */}
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleToggleAvailability(item._id, item.available)}
                                className={`${item.available ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-2 rounded-lg text-xs font-medium transition`}
                              >
                                {item.available ? '⏸️ Pause' : '▶️ Start'}
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
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
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
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