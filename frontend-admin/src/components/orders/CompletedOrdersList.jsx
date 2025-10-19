import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, Download, Calendar, Search, Filter, ArrowLeft, User, DollarSign, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';

const CompletedOrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('today');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchCompletedOrders();
    }, [dateFilter]);

    const fetchCompletedOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/staff/orders');
            const ordersData = response.data.data || [];

            // Filter completed orders
            let completedOrders = ordersData.filter(order => order.status === 'completed');

            // Apply date filter
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);

            switch (dateFilter) {
                case 'today':
                    completedOrders = completedOrders.filter(order =>
                        new Date(order.createdAt) >= today
                    );
                    break;
                case 'yesterday':
                    completedOrders = completedOrders.filter(order => {
                        const orderDate = new Date(order.createdAt);
                        return orderDate >= yesterday && orderDate < today;
                    });
                    break;
                case 'week':
                    completedOrders = completedOrders.filter(order =>
                        new Date(order.createdAt) >= weekAgo
                    );
                    break;
                case 'all':
                default:
                    break;
            }

            setOrders(completedOrders);
            setError(null);
        } catch (error) {
            console.error('Error fetching completed orders:', error);
            setError('Failed to load completed orders');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredOrders = () => {
        let filtered = orders;

        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customerWhatsapp.includes(searchTerm)
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'orderNumber':
                    return a.orderNumber.localeCompare(b.orderNumber);
                case 'amount':
                    const totalA = a.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const totalB = b.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    return totalB - totalA;
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    };

    const calculateTotal = (items) => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const exportToCSV = () => {
        const filteredOrders = getFilteredOrders();
        const csvData = [
            ['Order Number', 'Customer Name', 'WhatsApp', 'Items', 'Total Amount', 'Order Date', 'Completion Date'],
            ...filteredOrders.map(order => [
                order.orderNumber,
                order.customerName,
                order.customerWhatsapp,
                order.items.map(item => `${item.quantity}x ${item.name}`).join('; '),
                calculateTotal(order.items),
                new Date(order.createdAt).toLocaleString('en-IN'),
                new Date(order.updatedAt).toLocaleString('en-IN')
            ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `completed-orders-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredOrders = getFilteredOrders();
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + calculateTotal(order.items), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Link
                                    to="/pickup"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Pickup
                                </Link>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                                    Completed Orders
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    {filteredOrders.length} orders • Total Revenue: ₹{totalRevenue}
                                </p>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={exportToCSV}
                                    disabled={filteredOrders.length === 0}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </button>

                                <button
                                    onClick={fetchCompletedOrders}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search className="inline h-4 w-4 mr-1" />
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Order number, customer name, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Date Range
                            </label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">Last 7 Days</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Filter className="inline h-4 w-4 mr-1" />
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="orderNumber">Order Number</option>
                                <option value="amount">Amount (High to Low)</option>
                            </select>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm text-blue-600 font-medium">Quick Stats</div>
                            <div className="text-2xl font-bold text-blue-900">{filteredOrders.length}</div>
                            <div className="text-xs text-blue-600">Orders Found</div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="text-sm font-medium text-red-800">Error</div>
                        <div className="text-sm text-red-700 mt-1">{error}</div>
                    </div>
                )}

                {/* Orders Table */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading completed orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders found</h3>
                        <p className="text-gray-500">
                            {searchTerm || dateFilter !== 'all'
                                ? 'Try adjusting your search or date filter.'
                                : 'Completed orders will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timing
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{order.orderNumber}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                                                        <div className="text-xs text-gray-500">{order.customerWhatsapp}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {order.items.slice(0, 2).map((item, index) => (
                                                        <div key={index} className="flex justify-between">
                                                            <span>{item.quantity}x {item.name}</span>
                                                            <span>₹{item.price * item.quantity}</span>
                                                        </div>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            +{order.items.length - 2} more items
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                                    <span className="text-sm font-bold text-gray-900">
                                                        ₹{calculateTotal(order.items)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    <div>
                                                        <div>Ordered: {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div>Completed: {new Date(order.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedOrdersList;