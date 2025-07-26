const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Can be null for manual orders
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true
  },
  customerWhatsapp: {
    type: String,
    required: [true, 'Please add a WhatsApp number']
  },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['payment pending', 'preparing', 'ready', 'picked_up'],
    default: 'payment pending'
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'confirmed'],
    default: 'pending'
  },
  isManualOrder: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Fields for manual order claiming
  isManualOrder: {
    type: Boolean,
    default: false
  },
  isClaimable: {
    type: Boolean,
    default: false
  },
  claimedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  claimStatus: {
    type: String,
    enum: ['pending', 'claimed', 'rejected'],
    default: 'pending',
    required: false
  }
});

// Update the updatedAt field on save
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate a unique order number before validation
OrderSchema.pre('validate', async function(next) {
  // Only generate order number if it's a new document and orderNumber is not set
  if (this.isNew && !this.orderNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Get the count of orders created today
      const datePrefix = `${year}${month}${day}`;
      const count = await this.constructor.countDocuments({
        orderNumber: { $regex: `^${datePrefix}` }
      });
      
      // Format: YYMMDD-XXXX (where XXXX is a sequential number)
      this.orderNumber = `${datePrefix}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to update order status
OrderSchema.methods.updateStatus = function(newStatus) {
  const validStatuses = ['payment pending', 'preparing', 'ready', 'picked_up'];
  const currentIndex = validStatuses.indexOf(this.status);
  const newIndex = validStatuses.indexOf(newStatus);
  
  // Ensure status can only move forward in the workflow
  if (newIndex <= currentIndex && this.status !== newStatus) {
    throw new Error(`Cannot change status from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  this.updatedAt = Date.now();
  return this.save();
};

// Method to confirm payment
OrderSchema.methods.confirmPayment = function() {
  if (this.paymentStatus === 'confirmed') {
    throw new Error('Payment already confirmed');
  }
  
  this.paymentStatus = 'confirmed';
  
  // If status is payment pending, move to preparing
  if (this.status === 'payment pending') {
    this.status = 'preparing';
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

module.exports = mongoose.model('Order', OrderSchema);