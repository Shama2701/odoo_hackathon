const express = require('express');
const multer = require('multer');
const axios = require('axios');
const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');
const User = require('../models/User');
const { authenticateToken, authorize, sameCompany } = require('../middleware/auth');
const { validate, expenseValidation } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get exchange rate for currency conversion
const getExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) return 1;
    
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    return response.data.rates[toCurrency] || 1;
  } catch (error) {
    console.error('Exchange rate error:', error);
    return 1; // Fallback to 1 if API fails
  }
};

// @route   GET /api/expenses
// @desc    Get user expenses
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10, startDate, endDate } = req.query;
    
    const query = { company: req.user.company._id };
    
    // Role-based filtering
    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (req.user.role === 'manager') {
      // Manager can see their team's expenses
      const teamMembers = await User.find({ 
        manager: req.user._id,
        company: req.user.company._id 
      }).select('_id');
      
      query.$or = [
        { employee: req.user._id },
        { employee: { $in: teamMembers.map(member => member._id) } },
        { currentApprover: req.user._id }
      ];
    }
    // Admin can see all expenses
    
    if (status) query.status = status;
    if (category) query.category = category;
    
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }
    
    const expenses = await Expense.find(query)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email')
      .populate('approvalRule', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Expense.countDocuments(query);
    
    res.json({
      status: 'success',
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch expenses'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findById(id)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email')
      .populate('approvalHistory.approver', 'name email')
      .populate('approvalRule', 'name');
    
    if (!expense || expense.company._id.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }
    
    // Check access permissions
    if (req.user.role === 'employee' && expense.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    res.json({
      status: 'success',
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch expense'
    });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private (Employee)
router.post('/', authenticateToken, authorize('employee'), validate(expenseValidation.create), async (req, res) => {
  try {
    const { description, amount, currency, category, expenseDate, remarks } = req.body;
    
    // Get company base currency
    const company = req.user.company;
    const baseCurrency = company.currency;
    
    // Convert amount to base currency
    const exchangeRate = await getExchangeRate(currency, baseCurrency);
    const amountInBaseCurrency = amount * exchangeRate;
    
    // Find applicable approval rule
    const approvalRule = await ApprovalRule.findOne({
      company: company._id,
      isActive: true
    }).sort({ 'conditions.amountThreshold': -1 });
    
    let currentApprover = null;
    if (approvalRule && approvalRule.appliesToExpense({ 
      amountInBaseCurrency, 
      category 
    })) {
      currentApprover = approvalRule.getNextApprover();
    }
    
    const expense = new Expense({
      employee: req.user._id,
      company: company._id,
      description,
      amount,
      currency,
      amountInBaseCurrency,
      exchangeRate,
      category,
      expenseDate: new Date(expenseDate),
      remarks,
      status: 'draft',
      currentApprover,
      approvalRule: approvalRule?._id
    });
    
    await expense.save();
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email');
    
    res.status(201).json({
      status: 'success',
      message: 'Expense created successfully',
      data: { expense: populatedExpense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create expense'
    });
  }
});

// @route   POST /api/expenses/:id/upload-receipt
// @desc    Upload receipt for expense
// @access  Private (Employee)
router.post('/:id/upload-receipt', authenticateToken, authorize('employee'), upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findOne({ 
      _id: id, 
      employee: req.user._id,
      company: req.user.company._id 
    });
    
    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }
    
    if (expense.status !== 'draft') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot upload receipt for submitted expense'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Receipt file is required'
      });
    }
    
    expense.receipt = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    };
    
    await expense.save();
    
    res.json({
      status: 'success',
      message: 'Receipt uploaded successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload receipt'
    });
  }
});

// @route   PUT /api/expenses/:id/submit
// @desc    Submit expense for approval
// @access  Private (Employee)
router.put('/:id/submit', authenticateToken, authorize('employee'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findOne({ 
      _id: id, 
      employee: req.user._id,
      company: req.user.company._id 
    });
    
    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }
    
    if (expense.status !== 'draft') {
      return res.status(400).json({
        status: 'error',
        message: 'Expense already submitted'
      });
    }
    
    // Update status and set current approver
    expense.status = 'submitted';
    
    if (expense.approvalRule) {
      const approvalRule = await ApprovalRule.findById(expense.approvalRule);
      if (approvalRule) {
        expense.currentApprover = approvalRule.getNextApprover();
        if (expense.currentApprover) {
          expense.status = 'pending_approval';
        }
      }
    }
    
    await expense.save();
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email');
    
    res.json({
      status: 'success',
      message: 'Expense submitted for approval',
      data: { expense: populatedExpense }
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit expense'
    });
  }
});

// @route   PUT /api/expenses/:id/approve
// @desc    Approve expense
// @access  Private (Manager, Admin)
router.put('/:id/approve', authenticateToken, authorize('manager', 'admin'), validate(expenseValidation.approve), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const expense = await Expense.findById(id)
      .populate('approvalRule');
    
    if (!expense || expense.company._id.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }
    
    if (expense.status !== 'pending_approval') {
      return res.status(400).json({
        status: 'error',
        message: 'Expense is not pending approval'
      });
    }
    
    // Check if current user is the approver
    if (expense.currentApprover && expense.currentApprover.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to approve this expense'
      });
    }
    
    // Add to approval history
    expense.approvalHistory.push({
      approver: req.user._id,
      action: 'approved',
      comment: comment || 'Approved'
    });
    
    // Check if there are more approvers in the sequence
    if (expense.approvalRule) {
      const nextApprover = expense.approvalRule.getNextApprover(req.user._id);
      
      if (nextApprover) {
        expense.currentApprover = nextApprover;
        expense.status = 'pending_approval';
      } else {
        expense.currentApprover = null;
        expense.status = 'approved';
      }
    } else {
      expense.currentApprover = null;
      expense.status = 'approved';
    }
    
    await expense.save();
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email')
      .populate('approvalHistory.approver', 'name email');
    
    res.json({
      status: 'success',
      message: 'Expense approved successfully',
      data: { expense: populatedExpense }
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve expense'
    });
  }
});

// @route   PUT /api/expenses/:id/reject
// @desc    Reject expense
// @access  Private (Manager, Admin)
router.put('/:id/reject', authenticateToken, authorize('manager', 'admin'), validate(expenseValidation.reject), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const expense = await Expense.findById(id);
    
    if (!expense || expense.company._id.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }
    
    if (expense.status !== 'pending_approval') {
      return res.status(400).json({
        status: 'error',
        message: 'Expense is not pending approval'
      });
    }
    
    // Check if current user is the approver
    if (expense.currentApprover && expense.currentApprover.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to reject this expense'
      });
    }
    
    // Add to approval history
    expense.approvalHistory.push({
      approver: req.user._id,
      action: 'rejected',
      comment
    });
    
    expense.currentApprover = null;
    expense.status = 'rejected';
    
    await expense.save();
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('employee', 'name email')
      .populate('approvalHistory.approver', 'name email');
    
    res.json({
      status: 'success',
      message: 'Expense rejected',
      data: { expense: populatedExpense }
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject expense'
    });
  }
});

module.exports = router;
