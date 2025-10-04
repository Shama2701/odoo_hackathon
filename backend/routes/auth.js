const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

const router = express.Router();

// Get country and currency data
const getCountryCurrency = async (countryName) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    const countries = response.data;
    
    const country = countries.find(c => 
      c.name.common.toLowerCase() === countryName.toLowerCase() ||
      c.name.official.toLowerCase() === countryName.toLowerCase()
    );
    
    if (!country || !country.currencies) {
      throw new Error('Country not found or no currency information available');
    }
    
    const currencyCode = Object.keys(country.currencies)[0];
    const currencyInfo = country.currencies[currencyCode];
    
    return {
      currency: currencyCode,
      currencySymbol: currencyInfo.symbol || currencyCode,
      country: country.name.common
    };
  } catch (error) {
    console.error('Error fetching country currency:', error);
    throw new Error('Failed to fetch country currency information');
  }
};

// @route   POST /api/auth/signup
// @desc    Register admin user and create company
// @access  Public
router.post('/signup', validate(userValidation.signup), async (req, res) => {
  try {
    const { name, email, password, country } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    } 

    // Get country currency information
    const currencyInfo = await getCountryCurrency(country);

    // Create company first
    const company = new Company({
      name: `${name}'s Company`,
      country: currencyInfo.country,
      currency: currencyInfo.currency,
      currencySymbol: currencyInfo.currencySymbol
    });

    await company.save();

    // Create admin user with company reference
    const user = new User({
      name,
      email,
      password,
      role: 'admin',
      company: company._id
    });

    await user.save();

    // Update company with admin reference
    company.admin = user._id;
    await company.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'Company and admin user created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: {
            id: company._id,
            name: company.name,
            country: company.country,
            currency: company.currency,
            currencySymbol: company.currencySymbol
          }
        },
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create account',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(userValidation.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password').populate('company');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: {
            id: user.company._id,
            name: user.company.name,
            country: user.company.country,
            currency: user.company.currency,
            currencySymbol: user.company.currencySymbol
          },
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', validate(userValidation.forgotPassword), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset token
    // For now, we'll return the token in response (remove in production)
    res.json({
      status: 'success',
      message: 'Password reset token generated',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', validate(userValidation.resetPassword), async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          company: req.user.company,
          lastLogin: req.user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user information'
    });
  }
});

module.exports = router;
