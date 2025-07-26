import React from 'react';
import ProfileInfo from '../components/account/ProfileInfo';
import OrderHistory from '../components/account/OrderHistory';
import ClaimableOrders from '../components/account/ClaimableOrders';

const AccountPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Account</h1>
        <p className="text-gray-600">Manage your profile and view your order history</p>
      </div>

      {/* Claimable Orders - Show at top if any exist */}
      <ClaimableOrders />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div>
          <ProfileInfo />
        </div>

        {/* Recent Orders */}
        <div>
          <OrderHistory limit={2} />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;