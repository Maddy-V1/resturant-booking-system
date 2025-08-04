import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Settings, LogOut } from 'lucide-react';
import ProfileInfoCard from '../components/account/ProfileInfoCard';
import OrderCard from '../components/orders/OrderCard';
import { useAuth } from '../context/AuthContext';

const AccountPage = () => {
  const { logout } = useAuth();

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent orders
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const { orderService } = await import('../services/orderService');
        const result = await orderService.getUserOrders();
        
        if (result.success) {
          // Get only the 2 most recent orders
          const transformedOrders = result.data.slice(0, 2).map(order => ({
            id: order._id,
            createdAt: order.createdAt,
            status: order.status,
            items: order.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            total: order.totalAmount,
            pickupLocation: 'Main Canteen'
          }));
          
          setRecentOrders(transformedOrders);
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile and view your order history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <ProfileInfoCard />
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Account Actions */}
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                    <span className="text-gray-700 group-hover:text-gray-900">View All Orders</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </Link>
                
                <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                    <span className="text-gray-700 group-hover:text-gray-900">Account Settings</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                    <span className="text-gray-700 group-hover:text-red-700">Logout</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <Link
              to="/orders"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start by browsing our menu!
              </p>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors duration-200"
              >
                Browse Menu
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;