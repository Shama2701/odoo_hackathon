const Joi = require('joi');

// User validation schemas
const userValidation = {
  signup: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    country: Joi.string().trim().required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required()
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().required()
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  }),
  
  createUser: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'manager', 'employee').required(),
    manager: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
  }),
  
  updateUser: Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    email: Joi.string().email().lowercase().optional(),
    role: Joi.string().valid('admin', 'manager', 'employee').optional(),
    manager: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    isActive: Joi.boolean().optional()
  })
};

// Expense validation schemas
const expenseValidation = {
  create: Joi.object({
    description: Joi.string().trim().min(5).max(500).required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().required(),
    category: Joi.string().valid('food', 'travel', 'accommodation', 'transport', 'office', 'entertainment', 'other').required(),
    expenseDate: Joi.date().max('now').required(),
    remarks: Joi.string().trim().max(1000).optional()
  }),
  
  update: Joi.object({
    description: Joi.string().trim().min(5).max(500).optional(),
    amount: Joi.number().positive().optional(),
    currency: Joi.string().length(3).uppercase().optional(),
    category: Joi.string().valid('food', 'travel', 'accommodation', 'transport', 'office', 'entertainment', 'other').optional(),
    expenseDate: Joi.date().max('now').optional(),
    remarks: Joi.string().trim().max(1000).optional()
  }),
  
  approve: Joi.object({
    comment: Joi.string().trim().max(500).optional()
  }),
  
  reject: Joi.object({
    comment: Joi.string().trim().min(5).max(500).required()
  })
};

// Approval Rule validation schemas
const approvalRuleValidation = {
  create: Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500).optional(),
    conditions: Joi.object({
      amountThreshold: Joi.number().min(0).default(0),
      categories: Joi.array().items(Joi.string().valid('food', 'travel', 'accommodation', 'transport', 'office', 'entertainment', 'other')).optional(),
      departments: Joi.array().items(Joi.string()).optional()
    }).optional(),
    approvalFlow: Joi.object({
      type: Joi.string().valid('sequential', 'parallel', 'percentage').required(),
      approvers: Joi.array().items(Joi.object({
        user: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        order: Joi.number().integer().min(1).required(),
        isRequired: Joi.boolean().default(true)
      })).min(1).required(),
      percentageRequired: Joi.number().min(0).max(100).default(100),
      isManagerApprover: Joi.boolean().default(true),
      managerApprovalRequired: Joi.boolean().default(true)
    }).required(),
    escalationRules: Joi.object({
      autoEscalateAfter: Joi.number().min(1).default(72),
      escalationApprovers: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional()
    }).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().trim().min(3).max(100).optional(),
    description: Joi.string().trim().max(500).optional(),
    isActive: Joi.boolean().optional(),
    conditions: Joi.object({
      amountThreshold: Joi.number().min(0).optional(),
      categories: Joi.array().items(Joi.string().valid('food', 'travel', 'accommodation', 'transport', 'office', 'entertainment', 'other')).optional(),
      departments: Joi.array().items(Joi.string()).optional()
    }).optional(),
    approvalFlow: Joi.object({
      type: Joi.string().valid('sequential', 'parallel', 'percentage').optional(),
      approvers: Joi.array().items(Joi.object({
        user: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        order: Joi.number().integer().min(1).required(),
        isRequired: Joi.boolean().default(true)
      })).min(1).optional(),
      percentageRequired: Joi.number().min(0).max(100).optional(),
      isManagerApprover: Joi.boolean().optional(),
      managerApprovalRequired: Joi.boolean().optional()
    }).optional(),
    escalationRules: Joi.object({
      autoEscalateAfter: Joi.number().min(1).optional(),
      escalationApprovers: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional()
    }).optional()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    
    next();
  };
};

module.exports = {
  userValidation,
  expenseValidation,
  approvalRuleValidation,
  validate
};
