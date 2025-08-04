const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  available: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    required: [true, 'Please specify item type'],
    enum: {
      values: ['packaged', 'live'],
      message: 'Type must be either packaged (no preparation time) or live (requires preparation time)'
    }
  },
  cancelled: {
    type: Boolean,
    default: false
  },
  isDealOfDay: {
    type: Boolean,
    default: false
  },
  dealPrice: {
    type: Number,
    validate: {
      validator: function (value) {
        // Deal price should only be required if isDealOfDay is true
        // and should be less than the regular price
        return !this.isDealOfDay || (value && value < this.price);
      },
      message: 'Deal price must be less than regular price'
    }
  },
  dealExpiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for calculating discount percentage
MenuItemSchema.virtual('discountPercentage').get(function () {
  if (this.isDealOfDay && this.dealPrice) {
    return Math.round(((this.price - this.dealPrice) / this.price) * 100);
  }
  return 0;
});

// Ensure virtuals are included in JSON output
MenuItemSchema.set('toJSON', { virtuals: true });
MenuItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);