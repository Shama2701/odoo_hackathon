const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    length: [3, 'Currency must be 3 characters']
  },
  amountInBaseCurrency: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['food', 'travel', 'accommodation', 'transport', 'office', 'entertainment', 'other'],
    default: 'other'
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required']
  },
  receipt: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'pending_approval', 'approved', 'rejected'],
    default: 'draft'
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [1000, 'Remarks cannot exceed 1000 characters']
  },
  approvalHistory: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['approved', 'rejected']
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  currentApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRule'
  },
  ocrData: {
    extractedAmount: Number,
    extractedDate: Date,
    extractedMerchant: String,
    confidence: Number,
    rawText: String
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ employee: 1 });
expenseSchema.index({ company: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ currentApprover: 1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toFixed(2)} ${this.currency}`;
});

// Virtual for formatted amount in base currency
expenseSchema.virtual('formattedAmountInBaseCurrency').get(function() {
  return `${this.amountInBaseCurrency.toFixed(2)} ${this.company?.currency || 'USD'}`;
});

module.exports = mongoose.model('Expense', expenseSchema);
