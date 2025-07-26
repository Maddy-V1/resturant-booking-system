const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.itemId', 'name description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch orders',
        code: 'FETCH_ORDERS_ERROR'
      }
    });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Order must contain at least one item',
          code: 'INVALID_ITEMS'
        }
      });
    }

    if (!paymentMethod || !['online', 'offline'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Valid payment method is required (online or offline)',
          code: 'INVALID_PAYMENT_METHOD'
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

    // Create order
    const order = new Order({
      userId: req.user._id,
      customerName: req.user.name,
      customerWhatsapp: req.user.whatsapp,
      items: processedItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'confirmed' : 'pending',
      status: paymentMethod === 'online' ? 'preparing' : 'payment pending'
    });

    await order.save();

    // Populate the order for response
    await order.populate('items.itemId', 'name description');

    // Emit real-time notification to staff about new order
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.notifyStaffNewOrder(order);
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
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
        message: 'Failed to create order',
        code: 'CREATE_ORDER_ERROR'
      }
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID (accessible by order owner or staff)
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.itemId', 'name description')
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        }
      });
    }

    // Check if user is authorized to view this order
    // Allow if: user owns the order OR user is staff
    const isOwner = order.userId && order.userId._id.toString() === req.user._id.toString();
    const isStaff = req.user.role === 'staff';

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to view this order',
          code: 'UNAUTHORIZED_ORDER_ACCESS'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid order ID format',
          code: 'INVALID_ORDER_ID'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch order',
        code: 'FETCH_ORDER_ERROR'
      }
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Staff only)
router.put('/:id/status', authorize('staff'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Status is required',
          code: 'MISSING_STATUS'
        }
      });
    }

    const validStatuses = ['payment pending', 'preparing', 'ready', 'picked_up'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        }
      });
    }

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

    // Use the model method to update status (includes validation)
    await order.updateStatus(status);

    // Populate the updated order for response
    await order.populate('items.itemId', 'name description');
    await order.populate('userId', 'name email');

    // Emit real-time order status update
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.broadcastOrderStatusUpdate(order._id, order);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid order ID format',
          code: 'INVALID_ORDER_ID'
        }
      });
    }

    if (error.message.includes('Cannot change status')) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'INVALID_STATUS_TRANSITION'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update order status',
        code: 'UPDATE_STATUS_ERROR'
      }
    });
  }
});

module.exports = router;