import React, { useState, useEffect } from 'react';
import MenuItemCard from '../components/menu/MenuItemCard';
import SwiggyFloatingCart from '../components/cart/SwiggyFloatingCart';
import { useOrder } from '../context/OrderContext';
import { menuService } from '../services/menuService';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const { cartItems } = useOrder();

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
            imageUrl: item.imageUrl,
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

  // Separate deal and regular items
  const dealItems = menuItems.filter(item => item.isDealOfDay);
  const regularItems = menuItems.filter(item => !item.isDealOfDay);
  
  // Filter items based on active filter
  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'packaged':
        return regularItems.filter(item => item.type === 'packaged');
      case 'live':
        return regularItems.filter(item => item.type === 'live');
      default:
        return regularItems;
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
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            Delicious food made fresh daily with love and authentic flavors
          </p>
        </div>

        {/* Deal of the Day Section */}
        {dealItems.length > 0 && (
          <div className="mb-8">
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

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2 p-1 bg-gray-100 rounded-full max-w-sm mx-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">🍽️</span>
              All
            </button>
            <button
              onClick={() => setActiveFilter('packaged')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'packaged'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">📦</span>
              Packaged
            </button>
            <button
              onClick={() => setActiveFilter('live')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'live'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">🔥</span>
              Live
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="pb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">
                {activeFilter === 'packaged' ? '📦' : activeFilter === 'live' ? '🔥' : '🍽️'}
              </span>
              {activeFilter === 'packaged' ? 'Packaged Food' : activeFilter === 'live' ? 'Live Fresh Food' : 'All Items'}
            </h2>
            <div className="text-sm text-gray-500">
              {filteredItems.length} items available
            </div>
          </div>

          {activeFilter !== 'all' && (
            <div className="text-center text-sm text-gray-500 mb-4">
              {activeFilter === 'packaged' 
                ? 'Ready to eat items - served immediately' 
                : 'Freshly prepared items - requires cooking time'
              }
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {activeFilter === 'packaged' 
                  ? 'No packaged food items available right now' 
                  : activeFilter === 'live'
                  ? 'No live food items available right now'
                  : 'No menu items available right now'
                }
              </p>
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