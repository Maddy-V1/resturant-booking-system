const express = require('express');
const { body, validationResult } = require('express-validator');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware for menu item creation/update
const menuItemValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('imageUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('type')
    .isIn(['packaged', 'live'])
    .withMessage('Type must be either "packaged" or "live"'),
  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean'),
  body('isDealOfDay')
    .optional()
    .isBoolean()
    .withMessage('isDealOfDay must be a boolean'),
  body('dealPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deal price must be a positive number')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  next();
};

// Helper function to reset expired deals
const resetExpiredDeals = async () => {
  try {
    const now = new Date();
    await MenuItem.updateMany(
      { 
        isDealOfDay: true, 
        dealExpiresAt: { $lt: now } 
      },
      { 
        $set: { 
          isDealOfDay: false
        },
        $unset: {
          dealPrice: "",
          dealExpiresAt: ""
        }
      }
    );
  } catch (error) {
    console.error('Error resetting expired deals:', error);
  }
};

// @route   GET /api/menu
// @desc    Get menu items (available for public, all for admin)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Reset expired deals before fetching menu
    await resetExpiredDeals();

    // Check if request includes unavailable items (for admin)
    const includeUnavailable = req.query.includeUnavailable === 'true';
    
    // Build query filter
    const filter = includeUnavailable ? {} : { available: true };

    // Get menu items based on filter
    const menuItems = await MenuItem.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error fetching menu items',
        code: 'FETCH_ERROR'
      }
    });
  }
});

// @route   POST /api/menu
// @desc    Create a new menu item
// @access  Private (Staff only)
router.post('/', 
  protect, 
  authorize('staff'), 
  menuItemValidation, 
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, price, imageUrl, type, available, isDealOfDay, dealPrice } = req.body;

      // Validate deal price if isDealOfDay is true
      if (isDealOfDay && (!dealPrice || dealPrice >= price)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Deal price must be provided and less than regular price when setting as deal of day',
            code: 'INVALID_DEAL_PRICE'
          }
        });
      }

      // Create menu item data
      const menuItemData = {
        name,
        description,
        price,
        imageUrl: imageUrl || '',
        type,
        available: available !== undefined ? available : true
      };

      // Add deal information if applicable
      if (isDealOfDay) {
        menuItemData.isDealOfDay = true;
        menuItemData.dealPrice = dealPrice;
        // Set deal to expire at end of current day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        menuItemData.dealExpiresAt = tomorrow;
      }

      const menuItem = await MenuItem.create(menuItemData);

      // Emit real-time menu update
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.broadcastMenuUpdate('added', menuItem);
      }

      res.status(201).json({
        success: true,
        data: menuItem
      });
    } catch (error) {
      console.error('Error creating menu item:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: Object.values(error.errors).map(err => err.message)
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Error creating menu item',
          code: 'CREATE_ERROR'
        }
      });
    }
  }
);

// @route   PUT /api/menu/:id
// @desc    Update a menu item
// @access  Private (Staff only)
router.put('/:id', 
  protect, 
  authorize('staff'), 
  async (req, res) => {
    try {
      const { name, description, price, imageUrl, type, available, isDealOfDay, dealPrice } = req.body;

      // Validate required fields manually (bypassing middleware for deal updates)
      if (!name || !description || price === undefined || price < 0 || !type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Name, description, type, and valid price are required',
            code: 'VALIDATION_ERROR'
          }
        });
      }

      // Validate type field
      if (!['packaged', 'live'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Type must be either "packaged" or "live"',
            code: 'VALIDATION_ERROR'
          }
        });
      }

      // Find the menu item
      let menuItem = await MenuItem.findById(req.params.id);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Menu item not found',
            code: 'ITEM_NOT_FOUND'
          }
        });
      }

      // Validate deal price if isDealOfDay is true
      if (isDealOfDay && (!dealPrice || dealPrice >= price)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Deal price must be provided and less than regular price when setting as deal of day',
            code: 'INVALID_DEAL_PRICE'
          }
        });
      }

      // Update menu item data
      const updateData = {
        name,
        description,
        price,
        imageUrl: imageUrl || '',
        type,
        available: available !== undefined ? available : menuItem.available
      };

      // Handle deal of day logic
      if (isDealOfDay) {
        updateData.isDealOfDay = true;
        updateData.dealPrice = dealPrice;
        // Set deal to expire at end of current day if not already set or expired
        if (!menuItem.dealExpiresAt || menuItem.dealExpiresAt < new Date()) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          updateData.dealExpiresAt = tomorrow;
        }

        menuItem = await MenuItem.findByIdAndUpdate(
          req.params.id,
          { $set: updateData },
          { new: true, runValidators: true }
        );
      } else {
        updateData.isDealOfDay = false;
        
        menuItem = await MenuItem.findByIdAndUpdate(
          req.params.id,
          { 
            $set: updateData,
            $unset: {
              dealPrice: "",
              dealExpiresAt: ""
            }
          },
          { new: true, runValidators: true }
        );
      }

      // Emit real-time menu update
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.broadcastMenuUpdate('updated', menuItem);
      }

      res.status(200).json({
        success: true,
        data: menuItem
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: Object.values(error.errors).map(err => err.message)
          }
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid menu item ID',
            code: 'INVALID_ID'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Error updating menu item',
          code: 'UPDATE_ERROR'
        }
      });
    }
  }
);

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item
// @access  Private (Staff only)
router.delete('/:id', protect, authorize('staff'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Menu item not found',
          code: 'ITEM_NOT_FOUND'
        }
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    // Emit real-time menu update
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.broadcastMenuUpdate('deleted', menuItem);
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid menu item ID',
          code: 'INVALID_ID'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Error deleting menu item',
        code: 'DELETE_ERROR'
      }
    });
  }
});

// @route   PUT /api/menu/:id/toggle
// @desc    Toggle menu item availability
// @access  Private (Staff only)
router.put('/:id/toggle', protect, authorize('staff'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Menu item not found',
          code: 'ITEM_NOT_FOUND'
        }
      });
    }

    // Toggle availability
    menuItem.available = !menuItem.available;
    await menuItem.save();

    // Emit real-time menu update
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.broadcastMenuUpdate('availability-changed', menuItem);
    }

    res.status(200).json({
      success: true,
      data: menuItem,
      message: `Menu item ${menuItem.available ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling menu item availability:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid menu item ID',
          code: 'INVALID_ID'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Error toggling menu item availability',
        code: 'TOGGLE_ERROR'
      }
    });
  }
});

module.exports = router;