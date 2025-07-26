const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes and restrict to staff only
router.use(protect);
router.use(authorize('staff'));

// @route   GET /api/staff/pending-payments
// @desc    Get orders with pending offline payments
// @access  Private (Students and Staff)
router.get('/pending-payments', async (req, res) => {
  try {
    // Fetch orders with pending offline payments
    const orders = await Order.find({
      paymentMethod: 'offline',
      paymentStatus: 'pending'
    })
      .populate('items.itemId', 'name description')
      .populate('userId', 'name email whatsapp')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch pending payments',
        code: 'FETCH_PENDING_PAYMENTS_ERROR'
      }
    });
  }
});

// @route   GET /api/staff/orders
// @desc    Get all orders for staff view
// @access  Private (Students and Staff)
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Build query filter - only show orders with confirmed payment
    const filter = {
      paymentStatus: 'confirmed' // Only show orders with confirmed payment
    };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch orders with pagination
    const orders = await Order.find(filter)
      .populate('items.itemId', 'name description')
      .populate('userId', 'name email whatsapp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders for staff:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch orders',
        code: 'FETCH_ORDERS_ERROR'
      }
    });
  }
});

// @route   POST /api/staff/manual-order
// @desc    Create a manual order by staff
// @access  Private (Students and Staff)
router.post('/manual-order', async (req, res) => {
  try {
    const { customerName, customerWhatsapp, items } = req.body;

    // Validate required fields
    if (!customerName || !customerWhatsapp) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Customer name and WhatsApp number are required',
          code: 'MISSING_CUSTOMER_INFO'
        }
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Order must contain at least one item',
          code: 'INVALID_ITEMS'
        }
      });
    }

    // Validate and process items
    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Each item must have a valid itemId and quantity >= 1',
            code: 'INVALID_ITEM_DATA'
          }
        });
      }

      // Fetch menu item to get current price and availability
      const menuItem = await MenuItem.findById(item.itemId);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Menu item with ID ${item.itemId} not found`,
            code: 'MENU_ITEM_NOT_FOUND'
          }
        });
      }

      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Menu item "${menuItem.name}" is currently unavailable`,
            code: 'MENU_ITEM_UNAVAILABLE'
          }
        });
      }

      // Use deal price if it's deal of day and deal is active
      let itemPrice = menuItem.price;
      if (menuItem.isDealOfDay && menuItem.dealPrice && 
          (!menuItem.dealExpiresAt || menuItem.dealExpiresAt > new Date())) {
        itemPrice = menuItem.dealPrice;
      }

      const processedItem = {
        itemId: menuItem._id,
        name: menuItem.name,
        price: itemPrice,
        quantity: item.quantity
      };

      processedItems.push(processedItem);
      totalAmount += itemPrice * item.quantity;
    }

    // Create manual order (no userId for manual orders)
    // Manual orders are always considered as payment confirmed since staff handles them directly
    const order = new Order({
      customerName: customerName.trim(),
      customerWhatsapp: customerWhatsapp.trim(),
      items: processedItems,
      totalAmount,
      paymentMethod: 'offline', // Manual orders are always offline (handled by staff)
      paymentStatus: 'confirmed', // Manual orders are always payment confirmed
      status: 'preparing' // Start directly with preparing status
    });

    await order.save();

    // Populate the order for response
    await order.populate('items.itemId', 'name description');

    // Emit real-time notification to staff about new manual order
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.notifyStaffNewOrder(order);
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating manual order:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create manual order',
        code: 'CREATE_MANUAL_ORDER_ERROR'
      }
    });
  }
});

// @route   PUT /api/staff/orders/:id/payment
// @desc    Confirm offline payment
// @access  Private (Students and Staff)
router.put('/orders/:id/payment', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        }
      });
    }

    if (order.paymentMethod !== 'offline') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Payment confirmation is only available for offline payments',
          code: 'INVALID_PAYMENT_METHOD'
        }
      });
    }

    // Use the model method to confirm payment
    await order.confirmPayment();

    // Populate the updated order for response
    await order.populate('items.itemId', 'name description');
    await order.populate('userId', 'name email');

    // Emit real-time payment confirmation
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.broadcastPaymentConfirmation(order._id, order);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid order ID format',
          code: 'INVALID_ORDER_ID'
        }
      });
    }

    if (error.message.includes('Payment already confirmed')) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'PAYMENT_ALREADY_CONFIRMED'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to confirm payment',
        code: 'CONFIRM_PAYMENT_ERROR'
      }
    });
  }
});

module.exports = router;