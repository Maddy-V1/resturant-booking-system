import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';

const ManualOrderForm = () => {
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerWhatsapp: ''
  });
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch menu items on component mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setMenuLoading(true);
      const response = await api.get('/menu');
      setMenuItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to load menu items');
    } finally {
      setMenuLoading(false);
    }
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItemToOrder = (menuItem) => {
    const existingItem = selectedItems.find(item => item.itemId === menuItem._id);
    
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(item => 
          item.itemId === menuItem._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(prev => [...prev, {
        itemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.isDealOfDay && menuItem.dealPrice ? menuItem.dealPrice : menuItem.price,
        quantity: 1
      }]);
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setSelectedItems(prev => prev.filter(item => item.itemId !== itemId));
    } else {
      setSelectedItems(prev => 
        prev.map(item => 
          item.itemId === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeItemFromOrder = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validation
    if (!customerInfo.customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    
    if (!customerInfo.customerWhatsapp.trim()) {
      setError('Customer WhatsApp number is required');
      return;
    }
    
    if (selectedItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        customerName: customerInfo.customerName.trim(),
        customerWhatsapp: customerInfo.customerWhatsapp.trim(),
        items: selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        }))
      };

      const response = await api.post('/staff/manual-order', orderData);
      
      if (response.data.success) {
        const orderNumber = response.data.data._id.slice(-6).toUpperCase();
        setSuccess(`Order created successfully! Order ID: #${orderNumber}`);
        
        // Reset form
        setCustomerInfo({ customerName: '', customerWhatsapp: '' });
        setSelectedItems([]);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (error) {
      console.error('Error creating manual order:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to create order';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (menuLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create Manual Order</h1>
            <p className="text-gray-600 mt-1">Place an order on behalf of a customer</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{success}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={customerInfo.customerName}
                    onChange={handleCustomerInfoChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label htmlFor="customerWhatsapp" className="block text-sm font-medium text-gray-700">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    id="customerWhatsapp"
                    name="customerWhatsapp"
                    value={customerInfo.customerWhatsapp}
                    onChange={handleCustomerInfoChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter WhatsApp number"
                  />
                </div>
              </div>
            </div>

            {/* Menu Items Selection */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Menu Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.filter(item => item.available).map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        {item.isDealOfDay && item.dealPrice ? (
                          <div>
                            <span className="text-lg font-bold text-green-600">₹{item.dealPrice}</span>
                            <span className="text-sm text-gray-500 line-through ml-2">₹{item.price}</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Deal!</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addItemToOrder(item)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItemFromOrder(item.itemId)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 ml-2"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="ml-4 font-medium text-gray-900">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total: ₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Payment Confirmed</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Manual orders are automatically confirmed since they are handled directly by staff.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setCustomerInfo({ customerName: '', customerWhatsapp: '' });
                  setSelectedItems([]);
                  setPaymentMethod('offline');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualOrderForm;