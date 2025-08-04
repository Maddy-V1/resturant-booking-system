import React from 'react';

const OrderStatus = ({ status, paymentStatus, paymentMethod }) => {
  const getStatusSteps = () => {
    const steps = [
      { 
        key: 'payment pending', 
        label: 'Payment Pending', 
        icon: '💳',
        description: 'Waiting for payment confirmation'
      },
      { 
        key: 'preparing', 
        label: 'Being Prepared', 
        icon: '👨‍🍳',
        description: 'Your order is being prepared'
      },
      { 
        key: 'ready', 
        label: 'Ready for Pickup', 
        icon: '✅',
        description: 'Your order is ready for pickup!'
      },
      { 
        key: 'picked_up', 
        label: 'Picked Up', 
        icon: '📦',
        description: 'Order completed. Thank you!'
      }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === status);
    
    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentStepIndex,
      isCurrent: index === currentStepIndex
    }));
  };

  const getCurrentStatusMessage = () => {
    if (status === 'payment pending') {
      return 'Waiting for payment confirmation from gateway';
    }
    
    const statusMessages = {
      'preparing': 'Your order is being prepared',
      'ready': 'Your order is ready for pickup!',
      'picked_up': 'Order completed. Thank you!'
    };
    
    return statusMessages[status] || 'Processing your order...';
  };

  const getStatusColor = () => {
    const colors = {
      'payment pending': 'bg-yellow-50 text-yellow-800 border-yellow-200',
      'preparing': 'bg-blue-50 text-blue-800 border-blue-200',
      'ready': 'bg-green-50 text-green-800 border-green-200',
      'picked_up': 'bg-gray-50 text-gray-800 border-gray-200'
    };
    
    return colors[status] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  const statusSteps = getStatusSteps();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Order Status</h2>
        {paymentStatus === 'pending' && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Payment Pending
          </span>
        )}
      </div>
      
      {/* Progress Steps */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {/* Step Circle */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 transition-all duration-300 ${
                step.isActive 
                  ? step.isCurrent 
                    ? 'bg-blue-600 text-white animate-pulse shadow-lg' 
                    : 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.icon}
              </div>
              
              {/* Step Label */}
              <span className={`text-sm text-center font-medium transition-colors duration-300 ${
                step.isActive ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              
              {/* Progress Line */}
              {index < statusSteps.length - 1 && (
                <div className="absolute top-6 left-1/2 w-full h-0.5 -z-10 hidden sm:block">
                  <div className={`h-full transition-all duration-500 ${
                    step.isActive ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Status Message */}
      <div className={`p-4 rounded-lg border transition-all duration-300 ${getStatusColor()}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {status === 'ready' && (
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {status === 'preparing' && (
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center animate-spin">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {status === 'payment pending' && (
              <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {status === 'picked_up' && (
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium">{getCurrentStatusMessage()}</p>
            {status === 'ready' && (
              <p className="text-sm mt-1">Please collect your order from the counter</p>
            )}
          </div>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
        Updates in real-time
      </div>
    </div>
  );
};

export default OrderStatus;