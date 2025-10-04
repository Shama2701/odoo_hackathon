const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [100, 'Rule name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  conditions: {
    amountThreshold: {
      type: Number,
      default: 0
    },
    categories: [{
      type: String,
      enum: ['food', 'travel', 'accommodation', 'transport', 'office', 'entertainment', 'other']
    }],
    departments: [String]
  },
  approvalFlow: {
    type: {
      type: String,
      enum: ['sequential', 'parallel', 'percentage'],
      default: 'sequential'
    },
    approvers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      order: {
        type: Number,
        required: true
      },
      isRequired: {
        type: Boolean,
        default: true
      }
    }],
    percentageRequired: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    isManagerApprover: {
      type: Boolean,
      default: true
    },
    managerApprovalRequired: {
      type: Boolean,
      default: true
    }
  },
  escalationRules: {
    autoEscalateAfter: {
      type: Number, // hours
      default: 72
    },
    escalationApprovers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
approvalRuleSchema.index({ company: 1 });
approvalRuleSchema.index({ isActive: 1 });
approvalRuleSchema.index({ 'conditions.amountThreshold': 1 });

// Method to check if rule applies to expense
approvalRuleSchema.methods.appliesToExpense = function(expense) {
  if (!this.isActive) return false;
  
  // Check amount threshold
  if (expense.amountInBaseCurrency < this.conditions.amountThreshold) {
    return false;
  }
  
  // Check category
  if (this.conditions.categories.length > 0 && 
      !this.conditions.categories.includes(expense.category)) {
    return false;
  }
  
  return true;
};

// Method to get next approver
approvalRuleSchema.methods.getNextApprover = function(currentApproverId, approvedApprovers = []) {
  if (this.approvalFlow.type === 'sequential') {
    const sortedApprovers = this.approvalFlow.approvers.sort((a, b) => a.order - b.order);
    
    if (currentApproverId) {
      const currentIndex = sortedApprovers.findIndex(a => a.user.toString() === currentApproverId.toString());
      if (currentIndex !== -1 && currentIndex < sortedApprovers.length - 1) {
        return sortedApprovers[currentIndex + 1].user;
      }
    } else {
      return sortedApprovers[0]?.user;
    }
  }
  
  return null;
};

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
