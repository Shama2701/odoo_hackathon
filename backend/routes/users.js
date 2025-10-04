const express = require('express');
const User = require('../models/User');
const { authenticateToken, authorize, sameCompany } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users in company
// @access  Private (Admin, Manager)
router.get('/', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;
    
    const query = { company: req.user.company._id };
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const users = await User.find(query)
      .select('-password')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin, Manager, Employee - own profile)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user can access this profile
    if (req.user.role === 'employee' && req.user._id.toString() !== id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    const user = await User.findById(id)
      .select('-password')
      .populate('company')
      .populate('manager', 'name email');
    
    if (!user || user.company._id.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', authenticateToken, authorize('admin'), validate(userValidation.createUser), async (req, res) => {
  try {
    const { name, email, password, role, manager } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }
    
    // Validate manager if provided
    if (manager) {
      const managerUser = await User.findOne({ 
        _id: manager, 
        company: req.user.company._id,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (!managerUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid manager selected'
        });
      }
    }
    
    const user = new User({
      name,
      email,
      password,
      role,
      company: req.user.company._id,
      manager: manager || null
    });
    
    await user.save();
    
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('manager', 'name email');
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: { user: populatedUser }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', authenticateToken, authorize('admin'), validate(userValidation.updateUser), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const user = await User.findOne({ 
      _id: id, 
      company: req.user.company._id 
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Validate manager if provided
    if (updates.manager) {
      const managerUser = await User.findOne({ 
        _id: updates.manager, 
        company: req.user.company._id,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (!managerUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid manager selected'
        });
      }
    }
    
    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString() && updates.role) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot change your own role'
      });
    }
    
    Object.assign(user, updates);
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('manager', 'name email');
    
    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }
    
    const user = await User.findOne({ 
      _id: id, 
      company: req.user.company._id 
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

// @route   GET /api/users/team/:managerId
// @desc    Get team members under a manager
// @access  Private (Admin, Manager)
router.get('/team/:managerId', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Check if manager exists and belongs to same company
    const manager = await User.findOne({ 
      _id: managerId, 
      company: req.user.company._id 
    });
    
    if (!manager) {
      return res.status(404).json({
        status: 'error',
        message: 'Manager not found'
      });
    }
    
    const teamMembers = await User.find({ 
      manager: managerId,
      company: req.user.company._id,
      isActive: true
    })
    .select('-password')
    .sort({ name: 1 });
    
    res.json({
      status: 'success',
      data: { teamMembers }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch team members'
    });
  }
});

module.exports = router;
