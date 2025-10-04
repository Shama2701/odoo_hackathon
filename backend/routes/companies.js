const express = require('express');
const Company = require('../models/Company');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/companies
// @desc    Get company information
// @access  Private (Admin only)
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id)
      .populate('admin', 'name email');
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { company }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch company information'
    });
  }
});

// @route   PUT /api/companies
// @desc    Update company settings
// @access  Private (Admin only)
router.put('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { name, settings } = req.body;
    
    const company = await Company.findById(req.user.company._id);
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }
    
    if (name) company.name = name;
    if (settings) company.settings = { ...company.settings, ...settings };
    
    await company.save();
    
    res.json({
      status: 'success',
      message: 'Company updated successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update company'
    });
  }
});

module.exports = router;
