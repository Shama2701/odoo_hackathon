const express = require('express');
const ApprovalRule = require('../models/ApprovalRule');
const User = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, approvalRuleValidation } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/approval-rules
// @desc    Get approval rules for company
// @access  Private (Admin, Manager)
router.get('/', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    
    const query = { company: req.user.company._id };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const rules = await ApprovalRule.find(query)
      .populate('approvalFlow.approvers.user', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ApprovalRule.countDocuments(query);
    
    res.json({
      status: 'success',
      data: {
        rules,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch approval rules'
    });
  }
});

// @route   GET /api/approval-rules/:id
// @desc    Get approval rule by ID
// @access  Private (Admin, Manager)
router.get('/:id', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = await ApprovalRule.findOne({ 
      _id: id, 
      company: req.user.company._id 
    })
    .populate('approvalFlow.approvers.user', 'name email role')
    .populate('escalationRules.escalationApprovers', 'name email')
    .populate('createdBy', 'name email');
    
    if (!rule) {
      return res.status(404).json({
        status: 'error',
        message: 'Approval rule not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { rule }
    });
  } catch (error) {
    console.error('Get approval rule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch approval rule'
    });
  }
});

// @route   POST /api/approval-rules
// @desc    Create new approval rule
// @access  Private (Admin only)
router.post('/', authenticateToken, authorize('admin'), validate(approvalRuleValidation.create), async (req, res) => {
  try {
    const ruleData = req.body;
    
    // Validate approvers exist and belong to company
    const approverIds = ruleData.approvalFlow.approvers.map(a => a.user);
    const approvers = await User.find({ 
      _id: { $in: approverIds },
      company: req.user.company._id,
      role: { $in: ['admin', 'manager'] }
    });
    
    if (approvers.length !== approverIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more approvers not found or invalid role'
      });
    }
    
    // Validate escalation approvers if provided
    if (ruleData.escalationRules?.escalationApprovers) {
      const escalationApproverIds = ruleData.escalationRules.escalationApprovers;
      const escalationApprovers = await User.find({ 
        _id: { $in: escalationApproverIds },
        company: req.user.company._id,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (escalationApprovers.length !== escalationApproverIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'One or more escalation approvers not found or invalid role'
        });
      }
    }
    
    const rule = new ApprovalRule({
      ...ruleData,
      company: req.user.company._id,
      createdBy: req.user._id
    });
    
    await rule.save();
    
    const populatedRule = await ApprovalRule.findById(rule._id)
      .populate('approvalFlow.approvers.user', 'name email role')
      .populate('escalationRules.escalationApprovers', 'name email')
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      status: 'success',
      message: 'Approval rule created successfully',
      data: { rule: populatedRule }
    });
  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create approval rule'
    });
  }
});

// @route   PUT /api/approval-rules/:id
// @desc    Update approval rule
// @access  Private (Admin only)
router.put('/:id', authenticateToken, authorize('admin'), validate(approvalRuleValidation.update), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const rule = await ApprovalRule.findOne({ 
      _id: id, 
      company: req.user.company._id 
    });
    
    if (!rule) {
      return res.status(404).json({
        status: 'error',
        message: 'Approval rule not found'
      });
    }
    
    // Validate approvers if provided
    if (updates.approvalFlow?.approvers) {
      const approverIds = updates.approvalFlow.approvers.map(a => a.user);
      const approvers = await User.find({ 
        _id: { $in: approverIds },
        company: req.user.company._id,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (approvers.length !== approverIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'One or more approvers not found or invalid role'
        });
      }
    }
    
    // Validate escalation approvers if provided
    if (updates.escalationRules?.escalationApprovers) {
      const escalationApproverIds = updates.escalationRules.escalationApprovers;
      const escalationApprovers = await User.find({ 
        _id: { $in: escalationApproverIds },
        company: req.user.company._id,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (escalationApprovers.length !== escalationApproverIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'One or more escalation approvers not found or invalid role'
        });
      }
    }
    
    Object.assign(rule, updates);
    await rule.save();
    
    const populatedRule = await ApprovalRule.findById(rule._id)
      .populate('approvalFlow.approvers.user', 'name email role')
      .populate('escalationRules.escalationApprovers', 'name email')
      .populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      message: 'Approval rule updated successfully',
      data: { rule: populatedRule }
    });
  } catch (error) {
    console.error('Update approval rule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update approval rule'
    });
  }
});

// @route   DELETE /api/approval-rules/:id
// @desc    Delete approval rule
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = await ApprovalRule.findOne({ 
      _id: id, 
      company: req.user.company._id 
    });
    
    if (!rule) {
      return res.status(404).json({
        status: 'error',
        message: 'Approval rule not found'
      });
    }
    
    // Soft delete by setting isActive to false
    rule.isActive = false;
    await rule.save();
    
    res.json({
      status: 'success',
      message: 'Approval rule deactivated successfully'
    });
  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete approval rule'
    });
  }
});

// @route   GET /api/approval-rules/available-approvers
// @desc    Get available approvers for company
// @access  Private (Admin only)
router.get('/available-approvers', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const approvers = await User.find({ 
      company: req.user.company._id,
      role: { $in: ['admin', 'manager'] },
      isActive: true
    })
    .select('name email role')
    .sort({ name: 1 });
    
    res.json({
      status: 'success',
      data: { approvers }
    });
  } catch (error) {
    console.error('Get available approvers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available approvers'
    });
  }
});

module.exports = router;
