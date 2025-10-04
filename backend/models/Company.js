const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    length: [3, 'Currency must be 3 characters']
  },
  currencySymbol: {
    type: String,
    required: [true, 'Currency symbol is required'],
    maxlength: [5, 'Currency symbol cannot exceed 5 characters']
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Will be set after user creation
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowMultiCurrency: {
      type: Boolean,
      default: true
    },
    requireReceipt: {
      type: Boolean,
      default: true
    },
    autoApprovalLimit: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
companySchema.index({ name: 1 });
companySchema.index({ admin: 1 });

module.exports = mongoose.model('Company', companySchema);
