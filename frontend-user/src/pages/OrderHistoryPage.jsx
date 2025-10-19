import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Filter, Calendar, X } from 'lucide-react';
import OrderCard from '../components/orders/OrderCard';
import StatusBadge from '../components/common/StatusBadge';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { orderService } = await import('../services/orderService');
        const result = await orderService.getUserOrders();
        
        if (result.success) {
          // Transform API data to match frontend format
          const transformedOrders = result.data.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            status: order.status,
            items: order.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            total: order.totalAmount,
            pickupLocation: 'Main Canteen', // Default for now
            estimatedTime: getEstimatedTime(order.status)
          }));
          
          setOrders(transformedOrders);
          setFilteredOrders(transformedOrders);
        } else {
          console.error('Failed to fetch orders:', result.error);
          setOrders([]);
          setFilteredOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getEstimatedTime = (status) => {
    switch (status) {
      case 'preparing':
        return '10-15 mins';
      case 'ready':
        return 'Ready for pickup';
      case 'picked_up':
      case 'delivered':
        return 'Completed';
      default:
        return 'Processing';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'payment PENDING' },
    { value: 'confirmed', label: 'payment CONFIRMED' },
    { value: 'preparing', label: 'Preparing Food' },
    { value: 'ready', label: 'Ready for Pickup' },
    { value: 'delivered', label: 'Pickup Done' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Group orders by date with total amounts
  const groupOrdersByDate = (orders) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateKey = orderDate.toDateString();
      
      let groupLabel;
      if (dateKey === today.toDateString()) {
        groupLabel = 'Today';
      } else if (dateKey === yesterday.toDateString()) {
        groupLabel = 'Yesterday';
      } else {
        groupLabel = orderDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: orderDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }
      groups[groupLabel].push(order);
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.keys(groups).sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Yesterday') return -1;
      if (b === 'Yesterday') return 1;
      return new Date(groups[b][0].createdAt) - new Date(groups[a][0].createdAt);
    });

    return sortedGroups.map(label => {
      const groupOrders = groups[label].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const totalAmount = groupOrders.reduce((sum, order) => sum + order.total, 0);
      return {
        label,
        totalAmount,
        orders: groupOrders
      };
    });
  };

  // Filter orders based on status and date
  useEffect(() => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
        const toDate = dateFilter.to ? new Date(dateFilter.to) : null;

        if (fromDate && toDate) {
          // Both dates provided - check if order is within range
          return orderDate >= fromDate && orderDate <= toDate;
        } else if (fromDate) {
          // Only from date provided - check if order is after from date
          return orderDate >= fromDate;
        } else if (toDate) {
          // Only to date provided - check if order is before to date
          return orderDate <= toDate;
        }
        return true;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, dateFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <Link
            to="/account"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors duration-200 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Account
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Order History</h1>
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="inline-flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Filter by Date
            </button>
          </div>
        </div>

        {/* Date Filter Panel */}
        {showDateFilter && (
          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Filter by Date Range</h3>
                <button
                  onClick={() => setShowDateFilter(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setDateFilter({ from: '', to: '' })}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                >
                  Clear Dates
                </button>
                <button
                  onClick={() => setShowDateFilter(false)}
                  className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm font-medium"
                >
                  Apply Filter
                </button>
              </div>
              
              {(dateFilter.from || dateFilter.to) && (
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <strong>Active filter:</strong> 
                  {dateFilter.from && ` From ${new Date(dateFilter.from).toLocaleDateString()}`}
                  {dateFilter.from && dateFilter.to && ' and'}
                  {dateFilter.to && ` To ${new Date(dateFilter.to).toLocaleDateString()}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>



      {/* Orders List with WhatsApp-style grouping */}
      <div className="pb-6">
        {filteredOrders.length > 0 ? (
          <div>
            {groupOrdersByDate(filteredOrders).map((group) => (
              <div key={group.label} className="mb-6">
                {/* Date Header - WhatsApp style */}
                <div className="flex justify-center mb-4 mt-6">
                  <div className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                    {group.label}
                  </div>
                </div>
                
                {/* Orders in this date group */}
                <div className="space-y-3">
                  {group.orders.map((order) => (
                    <OrderCard key={order.id} order={order} showFullDetails={true} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mx-4 mt-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusFilter === 'all' && !dateFilter.from && !dateFilter.to 
                ? 'No orders found' 
                : `No orders found${statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}${dateFilter.from || dateFilter.to ? ' in the selected date range' : ''}`
              }
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              {statusFilter === 'all' && !dateFilter.from && !dateFilter.to
                ? "You haven't placed any orders yet."
                : `No orders match your current filters. Try adjusting your search criteria.`
              }
            </p>
            <div className="flex flex-col space-y-3">
              {(statusFilter !== 'all' || dateFilter.from || dateFilter.to) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter({ from: '', to: '' });
                    setShowDateFilter(false);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Clear All Filters
                </button>
              )}
              <Link
                to="/"
                className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                Browse Menu
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;