import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import MenuItemCard from '../components/menu/MenuItemCard';
import SwiggyFloatingCart from '../components/cart/SwiggyFloatingCart';
import { useOrder } from '../context/OrderContext';
import { menuService } from '../services/menuService';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');


  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await menuService.getMenuItems();

        if (result.success) {
          // Transform API data to match frontend format
          const transformedItems = result.data.map(item => ({
            id: item._id,
            name: item.name,
            description: item.description,
            price: item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price,
            originalPrice: item.isDealOfDay && item.dealPrice ? item.price : null,
            isDealOfDay: item.isDealOfDay,
            available: item.available,
            type: item.type,
            imageUrl: item.imageUrl || '',
            sometimes: item.sometimes || false,
            discountPercentage: item.discountPercentage || 0
          }));

          setMenuItems(transformedItems);
        } else {
          setError(result.error.message);
          // Fallback to mock data if API fails
          setMenuItems([]);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setError('Failed to load menu items');
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Apply search filter to all items first
  const getSearchFilteredItems = (items) => {
    if (!searchQuery.trim()) {
      return items;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );
  };

  // Separate deal and sometimes available items for special sections (with search applied)
  const dealItems = getSearchFilteredItems(menuItems.filter(item => item.isDealOfDay));
  const sometimesItems = getSearchFilteredItems(menuItems.filter(item => item.sometimes && !item.isDealOfDay));
  // All items for regular menu sections (including deal and sometimes items)
  const allItems = menuItems;

  // Sort all items: live food first, then packaged food
  const sortedAllItems = [...allItems].sort((a, b) => {
    // Live items first (type 'live' comes before 'packaged')
    if (a.type === 'live' && b.type === 'packaged') return -1;
    if (a.type === 'packaged' && b.type === 'live') return 1;
    // Within same type, sort by name
    return a.name.localeCompare(b.name);
  });

  // Filter items based on active filter (search is already applied to sortedAllItems)
  const getFilteredItems = () => {
    let filtered = getSearchFilteredItems(sortedAllItems);

    // Apply type filter
    switch (activeFilter) {
      case 'live':
        return filtered.filter(item => item.type === 'live');
      case 'packaged':
        return filtered.filter(item => item.type === 'packaged');
      default:
        return filtered; // All items, but live first
    }
  };

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="text-center mb-8">
              <div className="h-8 sm:h-10 bg-gray-300 rounded w-1/3 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>

            {/* Deal section skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="flex space-x-4 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-44 sm:w-52">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                      <div className="aspect-square bg-gray-300 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                      <div className="h-8 bg-gray-300 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular menu skeleton */}
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                  <div className="aspect-square bg-gray-300 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-7 bg-gray-300 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Our Menu
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
            Delicious food made fresh daily with love and authentic flavors
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Deal of the Day and Sometimes Available Section */}
        {(dealItems.length > 0 || sometimesItems.length > 0) && (
          <div className="mb-8">
            {/* Desktop Layout: Side by side */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-8">
                {/* Deal of the Day */}
                {dealItems.length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                        <span className="text-2xl mr-2">🔥</span>
                        Deal of the Day
                      </h2>
                    </div>

                    <div className="relative">
                      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {dealItems.map((item) => (
                          <div key={item.id} className="flex-shrink-0 w-44 sm:w-52">
                            <MenuItemCard item={item} />
                          </div>
                        ))}
                      </div>

                      {/* Gradient fade effect */}
                      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-orange-50 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                )}

                {/* Sometimes Available */}
                {sometimesItems.length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                        <span className="text-2xl mr-2">⭐</span>
                        Sometimes Available
                      </h2>
                    </div>

                    <div className="relative">
                      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {sometimesItems.map((item) => (
                          <div key={item.id} className="flex-shrink-0 w-44 sm:w-52">
                            <MenuItemCard item={item} />
                          </div>
                        ))}
                      </div>

                      {/* Gradient fade effect */}
                      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-orange-50 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout: Stacked */}
            <div className="lg:hidden">
              {/* Deal of the Day */}
              {dealItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                      <span className="text-2xl mr-2">🔥</span>
                      Deal of the Day
                    </h2>
                  </div>

                  <div className="relative">
                    <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {dealItems.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-44 sm:w-52">
                          <MenuItemCard item={item} />
                        </div>
                      ))}
                    </div>

                    {/* Gradient fade effect */}
                    <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-orange-50 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              )}

              {/* Sometimes Available */}
              {sometimesItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                      <span className="text-2xl mr-2">⭐</span>
                      Sometimes Available
                    </h2>
                  </div>

                  <div className="relative">
                    <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {sometimesItems.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-44 sm:w-52">
                          <MenuItemCard item={item} />
                        </div>
                      ))}
                    </div>

                    {/* Gradient fade effect */}
                    <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-orange-50 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2 p-1 bg-gray-100 rounded-full max-w-sm mx-auto">
            <button
              onClick={() => setActiveFilter('live')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeFilter === 'live'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="mr-1">🔥</span>
              Live
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeFilter === 'all'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="mr-1">🍽️</span>
              All
            </button>
            <button
              onClick={() => setActiveFilter('packaged')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeFilter === 'packaged'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="mr-1">📦</span>
              Packaged
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="pb-24">

          {activeFilter !== 'all' && (
            <div className="text-center text-sm text-gray-500 mb-4">
              {activeFilter === 'live'
                ? 'Freshly prepared items - requires cooking time'
                : 'Ready to eat items - served immediately'
              }
            </div>
          )}

          {activeFilter === 'all' ? (
            // Show sections for "All" view
            <div className="space-y-8">
              {/* Live Food Section */}
              {filteredItems.filter(item => item.type === 'live').length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🔥</span>
                      <h3 className="text-lg font-bold text-gray-900">Live Fresh Food</h3>
                      <span className="text-sm text-gray-500">
                        ({filteredItems.filter(item => item.type === 'live').length} items)
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-red-200 to-transparent ml-4"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredItems.filter(item => item.type === 'live').map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Packaged Food Section */}
              {filteredItems.filter(item => item.type === 'packaged').length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📦</span>
                      <h3 className="text-lg font-bold text-gray-900">Ready to Eat</h3>
                      <span className="text-sm text-gray-500">
                        ({filteredItems.filter(item => item.type === 'packaged').length} items)
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent ml-4"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredItems.filter(item => item.type === 'packaged').map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Single grid for filtered views
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchQuery.trim() 
                  ? `No items found for "${searchQuery}". Try a different search term.`
                  : activeFilter === 'live'
                    ? 'No live food items available right now'
                    : activeFilter === 'packaged'
                      ? 'No packaged food items available right now'
                      : 'No menu items available right now'
                }
              </p>
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Swiggy-Style Floating Cart */}
      <SwiggyFloatingCart />
    </div>
  );
};
export default MenuPage;