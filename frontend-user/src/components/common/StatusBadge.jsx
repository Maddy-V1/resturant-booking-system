import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';

const StatusBadge = ({ status, size = 'md' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'payment PENDING',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
      },
      'payment pending': {
        label: 'payment PENDING',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
      },
      confirmed: {
        label: 'payment CONFIRMED',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle,
      },
      preparing: {
        label: 'Preparing Food',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Package,
      },
      ready: {
        label: 'Ready for Pickup',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      delivered: {
        label: 'Pickup Done',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      picked_up: {
        label: 'Pickup Done',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
      },
      failed: {
        label: 'Failed',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
      },
    };

    return configs[status] || configs.pending;
  };

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'h-3 w-3',
    },
    md: {
      container: 'px-3 py-1 text-sm',
      icon: 'h-4 w-4',
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
    },
  };

  const config = getStatusConfig(status);
  const sizeConfig = sizeClasses[size];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1 font-medium rounded-full border ${config.color} ${sizeConfig.container}`}
    >
      <Icon className={sizeConfig.icon} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;