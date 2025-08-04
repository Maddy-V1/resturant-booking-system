import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, GraduationCap, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileInfoCard = () => {
  const { user } = useAuth();
  const [orderStats, setOrderStats] = useState({ totalOrders: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch user order statistics
  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const { orderService } = await import('../../services/orderService');
        const result = await orderService.getUserOrders();
        
        if (result.success) {
          const orders = result.data;
          const totalOrders = orders.length;
          // Only count completed orders for total spent
          const completedOrders = orders.filter(order => 
            ['picked_up', 'delivered'].includes(order.status)
          );
          const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
          
          setOrderStats({ totalOrders, totalSpent });
        }
      } catch (error) {
        console.error('Error fetching order stats:', error);
        setOrderStats({ totalOrders: 0, totalSpent: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrderStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const profileFields = [
    {
      label: 'Full Name',
      value: user?.name || 'Loading...',
      icon: User,
    },
    {
      label: 'Email Address',
      value: user?.email || 'Loading...',
      icon: Mail,
    },
    {
      label: 'WhatsApp Number',
      value: user?.whatsapp || 'Loading...',
      icon: Phone,
    },
    {
      label: 'Account Type',
      value: user?.role === 'student' ? 'University Student' : user?.role === 'staff' ? 'University Staff' : 'Loading...',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
        <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200">
          <Edit className="h-4 w-4" />
          <span className="text-sm font-medium">Edit</span>
        </button>
      </div>

      {/* Profile Picture */}
      <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-100">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user?.name || 'Student Name'}
          </h3>
          <p className="text-sm text-gray-600">
            {user?.role === 'student' ? 'University Student' : user?.role === 'staff' ? 'University Staff' : 'User'}
          </p>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="space-y-4">
        {profileFields.map((field, index) => {
          const Icon = field.icon;
          return (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  {field.label}
                </p>
                <p className="text-sm text-gray-900 truncate">
                  {field.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Stats */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : orderStats.totalOrders}
            </div>
            <div className="text-sm text-blue-700">Total Orders</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ₹{loading ? '...' : orderStats.totalSpent.toFixed(2)}
            </div>
            <div className="text-sm text-green-700">Total Spent</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCard;