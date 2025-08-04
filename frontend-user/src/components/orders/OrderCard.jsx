import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Receipt, Clock, Eye } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const OrderCard = ({ order, showFullDetails = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const getTotalItems = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemsSummary = (items) => {
    if (items.length <= 2) {
      return items.map(item => `${item.name} (${item.quantity})`).join(', ');
    }
    return `${items[0].name} (${items[0].quantity}), ${items[1].name} (${items[1].quantity}) +${items.length - 2} more`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-100 mx-2">
      {/* Order Number and Status on same line */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">
          #{order.orderNumber}
        </h3>
        <StatusBadge status={order.status} size="sm" />
      </div>

      {/* Total Items Count without amount */}
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {getTotalItems(order.items)} item{getTotalItems(order.items) > 1 ? 's' : ''}
        </p>
      </div>

      {/* Time Display */}
      <div className="flex items-center text-xs text-gray-500 mb-3">
        <Clock className="h-3 w-3 mr-1" />
        {formatTime(order.createdAt)}
      </div>

      {/* Mobile-optimized Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-base font-bold text-gray-900">
          ₹{order.total.toFixed(0)}
        </div>

        <div className="flex gap-2">
          {/* Track Order Button - Show for active orders */}
          {['payment pending', 'preparing', 'ready', 'confirmed'].includes(order.status) && (
            <Link
              to={`/order/${order.id}`}
              className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            >
              <Eye className="h-3 w-3 mr-1" />
              Track
            </Link>
          )}

          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center">
            <Receipt className="h-3 w-3 mr-1" />
            Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;