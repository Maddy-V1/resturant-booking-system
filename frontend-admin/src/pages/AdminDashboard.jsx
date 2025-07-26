import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminDashboard = () => {
  const { user } = useAdminAuth();

  const dashboardCards = [
    {
      title: 'Manual Order',
      description: 'Create orders for customers who prefer in-person ordering',
      link: '/manual-order',
      icon: '📝',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Menu Management',
      description: 'Add, edit, and manage menu items and daily deals',
      link: '/menu',
      icon: '🍽️',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Order Queue',
      description: 'View and manage current orders in the preparation queue',
      link: '/orders',
      icon: '📋',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: 'Payment Confirmation',
      description: 'Confirm offline payments and process cash transactions',
      link: '/payments',
      icon: '💰',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to the Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Hello {user?.name}! Manage your college canteen operations from here.
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {dashboardCards.map((card, index) => (
              <Link
                key={index}
                to={card.link}
                className={`${card.color} text-white rounded-lg shadow-lg p-6 transition-all duration-200 transform hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                    <p className="text-white/90 text-sm">{card.description}</p>
                  </div>
                  <div className="text-4xl opacity-80">
                    {card.icon}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Stats Section */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/manual-order"
                className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:bg-indigo-100 transition-colors"
              >
                <h3 className="font-medium text-indigo-900">Create New Order</h3>
                <p className="text-sm text-indigo-700 mt-1">Place an order for a customer</p>
              </Link>
              
              <Link
                to="/menu"
                className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
              >
                <h3 className="font-medium text-green-900">Add Menu Item</h3>
                <p className="text-sm text-green-700 mt-1">Add new items to the menu</p>
              </Link>
              
              <Link
                to="/orders"
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors"
              >
                <h3 className="font-medium text-yellow-900">View Orders</h3>
                <p className="text-sm text-yellow-700 mt-1">Check current order queue</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;