import React from 'react';
import { Link } from 'react-router-dom';
import OrderHistory from '../components/account/OrderHistory';
import ClaimableOrders from '../components/account/ClaimableOrders';

const OrderHistoryPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/account" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Account
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Order History</h1>
        <p className="text-gray-600">View all your past orders</p>
      </div>

      {/* Claimable Orders - Show at top if any exist */}
      <ClaimableOrders />
      
      <OrderHistory />
    </div>
  );
};

export default OrderHistoryPage;