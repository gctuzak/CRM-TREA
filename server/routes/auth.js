const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  validateLogin, 
  validateRegister, 
  validatePasswordChange 
} = require('../middleware/validation');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// @route   POST /api/auth/login
// @desc    Login user (TEMPORARILY DISABLED VALIDATION)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // TEMPORARY: Skip validation and create a mock user for any email
    const mockUser = {
      ID: 1,
      NAME: 'Test User',
      EMAIL: email,
      ROLE: 'admin',
      DEPARTMENT_ID: null,
      LAST_LOGIN: new Date()
    };

    // Generate token for mock user
    const token = generateToken(mockUser.ID);

    res.json({
      message: 'Giriş başarılı (Test Modu)',
      token,
      user: {
        id: mockUser.ID,
        name: mockUser.NAME,
        email: mockUser.EMAIL,
        role: mockUser.ROLE,
        departmentId: mockUser.DEPARTMENT_ID,
        lastLogin: mockUser.LAST_LOGIN
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private (Admin)
router.post('/register', authenticateToken, requireAdmin, validateRegister, async (req, res) => {
  try {
    const { name, email, password, phone, departmentId, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
        error: 'EMAIL_EXISTS'
      });
    }

    // Create new user
    const newUser = await User.create({
      NAME: name,
      EMAIL: email,
      PASSWORD: password,
      PHONE: phone,
      DEPARTMENT_ID: departmentId,
      ROLE: role || 'user',
      STATUS: 'active',
      CREATED_DATE: new Date()
    });

    res.status(201).json({
      message: 'Kayıt başarılı',
      user: {
        id: newUser.ID,
        name: newUser.NAME,
        email: newUser.EMAIL,
        role: newUser.ROLE,
        departmentId: newUser.DEPARTMENT_ID,
        status: newUser.STATUS
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile (MVP - Auto admin user)
// @access  Public (MVP)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Return the auto-logged admin user from middleware
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        organization: req.user.organization,
        orid: req.user.orid
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to get user profile',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Update user profile
    await user.update({
      NAME: name || user.NAME,
      PHONE: phone || user.PHONE,
      UPDATED_DATE: new Date()
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.ID,
        name: user.NAME,
        email: user.EMAIL,
        phone: user.PHONE,
        role: user.ROLE,
        departmentId: user.DEPARTMENT_ID
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        message: 'Mevcut şifre yanlış',
        error: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    await user.update({
      PASSWORD: newPassword,
      UPDATED_DATE: new Date()
    });

    res.json({
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const newToken = generateToken(userId);

    res.json({
      message: 'Token başarıyla yenilendi',
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Failed to refresh token',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Çıkış başarılı. Lütfen token\'ı istemci depolamasından kaldırın.'
  });
});

module.exports = router;