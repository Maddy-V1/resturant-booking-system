import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import ManualOrderModal from '../components/orders/ManualOrderModal';

const AdminDashboard = () => {
  const { user } = useAdminAuth();
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);

  const dashboardCards = [
    {
      title: 'Menu Management',
      description: 'Add, edit, and manage menu items and daily deals',
      link: '/menu',
      icon: '🍽️',
      color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    },
    {
      title: 'Kitchen Orders',
      description: 'View and manage orders being prepared in the kitchen',
      link: '/kitchen',
      icon: '👨‍🍳',
      color: 'bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
    },
    {
      title: 'Pickup Counter',
      description: 'Manage ready orders and create manual orders',
      link: '/pickup',
      icon: '📦',
      color: 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">
                  Welcome Back, {user?.name}! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  Manage your college canteen operations efficiently from this dashboard.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="text-6xl opacity-20">🏫</div>
              </div>
            </div>
          </div>

          {/* Manual Order CTA */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-full p-4 mr-6">
                    <span className="text-4xl">📝</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Create Manual Order</h2>
                    <p className="text-indigo-100">
                      Quickly create orders for walk-in customers directly from here
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualOrderModal(true)}
                  className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Create Order
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {dashboardCards.map((card, index) => (
              <Link
                key={index}
                to={card.link}
                className={`${card.color} text-white rounded-2xl shadow-xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Stats Section */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">⚡</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/pickup"
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 group cursor-pointer block"
              >
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-300">📝</span>
                  <h3 className="font-bold text-blue-900">Manual Orders</h3>
                </div>
                <p className="text-sm text-blue-700">Create orders directly from the pickup counter for walk-in customers</p>
              </Link>
              
              <Link
                to="/menu"
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 group cursor-pointer block"
              >
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-300">🍽️</span>
                  <h3 className="font-bold text-green-900">Menu Items</h3>
                </div>
                <p className="text-sm text-green-700">Add new dishes, set daily deals, and manage item availability</p>
              </Link>
              
              <Link
                to="/kitchen"
                className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 hover:from-orange-100 hover:to-red-100 transition-all duration-300 group cursor-pointer block"
              >
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-300">🔔</span>
                  <h3 className="font-bold text-orange-900">Live Updates</h3>
                </div>
                <p className="text-sm text-orange-700">Real-time notifications and sound alerts for new orders</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Order Modal */}
      <ManualOrderModal
        isOpen={showManualOrderModal}
        onClose={() => setShowManualOrderModal(false)}
        onOrderCreated={(newOrder) => {
          console.log('New manual order created from dashboard:', newOrder);
          // You could add a success message here if needed
        }}
      />
    </div>
  );
};

export default AdminDashboard;