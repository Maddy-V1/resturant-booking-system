import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, User, Phone } from 'lucide-react';
import api from '../../utils/axios';

const ManualOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
      // Reset form when modal opens
      setSelectedItems([]);
      setCustomerName('');
      setCustomerWhatsapp('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu');
      const availableItems = response.data.data.filter(item => item.available);
      setMenuItems(availableItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to load menu items');
    }
  };

  const addItem = (menuItem) => {
    const existingItem = selectedItems.find(item => item.itemId === menuItem._id);
    
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.itemId === menuItem._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        itemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.isDealOfDay && menuItem.dealPrice ? menuItem.dealPrice : menuItem.price,
        quantity: 1
      }]);
    }
  };

  const removeItem = (itemId) => {
    const existingItem = selectedItems.find(item => item.itemId === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(selectedItems.map(item =>
        item.itemId === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    
    if (!customerWhatsapp.trim()) {
      setError('WhatsApp number is required');
      return;
    }
    
    if (selectedItems.length === 0) {
      setError('Please select at least one item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        customerName: customerName.trim(),
        customerWhatsapp: customerWhatsapp.trim(),
        items: selectedItems,
        paymentMethod: 'offline',
        isManualOrder: true
      };

      const response = await api.post('/staff/manual-order', orderData);
      
      setSuccess(true);
      
      // Call the callback to refresh orders
      if (onOrderCreated) {
        onOrderCreated(response.data.data);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating manual order:', error);
      setError(error.response?.data?.error?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Create Manual Order</h2>
            <p className="text-blue-100 text-sm">For walk-in customers</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Side - Menu Items */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
              Available Items
            </h3>
            
            <div className="grid gap-3">
              {menuItems.map((item) => (
                <div key={item._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-lg text-gray-900">
                        ₹{item.isDealOfDay && item.dealPrice ? item.dealPrice : item.price}
                      </div>
                      {item.isDealOfDay && item.dealPrice && (
                        <div className="text-xs text-red-500 line-through">₹{item.price}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {item.isDealOfDay && (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                        Deal of Day
                      </span>
                    )}
                    <button
                      onClick={() => addItem(item)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Order Form */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Customer Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter WhatsApp number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Selected Items */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Selected Items ({selectedItems.length})
                </h3>
                
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No items selected</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <div key={item.itemId} className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.itemId)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <span className="bg-white px-3 py-1 rounded font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => addItem({ _id: item.itemId, name: item.name, price: item.price })}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          
                          <div className="text-right ml-4">
                            <div className="font-bold text-gray-900">
                              ₹{item.price * item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              {selectedItems.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">₹{calculateTotal()}</span>
                  </div>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">✅ Order created successfully!</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || selectedItems.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <ShoppingCart className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualOrderModal;