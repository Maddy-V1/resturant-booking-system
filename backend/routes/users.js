const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch user profile',
        code: 'FETCH_PROFILE_ERROR'
      }
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { name, whatsapp } = req.body;
    
    // Validate input
    if (!name || !whatsapp) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Name and WhatsApp number are required',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, whatsapp },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
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
        message: 'Failed to update user profile',
        code: 'UPDATE_PROFILE_ERROR'
      }
    });
  }
});

// @route   GET /api/users/claimable-orders
// @desc    Get manual orders that match user's WhatsApp number
// @access  Private
router.get('/claimable-orders', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Find manual orders with matching WhatsApp number that are claimable
    const claimableOrders = await Order.find({
      isManualOrder: true,
      isClaimable: true,
      customerWhatsapp: user.whatsapp,
      claimStatus: 'pending'
    })
      .populate('items.itemId', 'name description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: claimableOrders
    });
  } catch (error) {
    console.error('Error fetching claimable orders:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch claimable orders',
        code: 'FETCH_CLAIMABLE_ORDERS_ERROR'
      }
    });
  }
});

// @route   POST /api/users/claim-order/:orderId
// @desc    Claim a manual order
// @access  Private
router.post('/claim-order/:orderId', async (req, res) => {
  try {
    const { claim } = req.body; // true to claim, false to reject
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        }
      });
    }

    if (!order.isManualOrder || !order.isClaimable) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Order is not claimable',
          code: 'ORDER_NOT_CLAIMABLE'
        }
      });
    }

    const user = await User.findById(req.user._id);
    
    // Verify WhatsApp number matches
    if (order.customerWhatsapp !== user.whatsapp) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'WhatsApp number does not match',
          code: 'WHATSAPP_MISMATCH'
        }
      });
    }

    if (claim) {
      // User claims the order
      order.claimedByUser = user._id;
      order.userId = user._id; // Associate order with user
      order.claimStatus = 'claimed';
      order.isClaimable = false;
    } else {
      // User rejects the order
      order.claimStatus = 'rejected';
      order.isClaimable = false;
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: claim ? 'Order claimed successfully' : 'Order rejected successfully'
    });
  } catch (error) {
    console.error('Error claiming order:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to claim order',
        code: 'CLAIM_ORDER_ERROR'
      }
    });
  }
});

module.exports = router;