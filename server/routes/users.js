const express = require('express');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticateToken, requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with pagination and filters
// @access  Public (MVP)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Build where clause for search
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { NAME: { [Op.like]: `%${search}%` } },
        { EMAIL: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['PASSWORD', 'KEYP'] }, // Exclude password fields
      limit,
      offset,
      order: [['NAME', 'ASC']]
    });

    // Users are already in correct format
    const transformedUsers = users.map(user => user.toJSON());

    const totalPages = Math.ceil(count / limit);

    res.json({
      users: transformedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public (MVP)
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['PASSWORD', 'KEYP'] }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to fetch user',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Public (MVP)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { EMAIL: email } });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
        error: 'USER_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      NAME: name,
      EMAIL: email,
      PASSWORD: hashedPassword,
      PHONE: phone,
      ROLE: role || 'user',
      STATUS: 'active'
    });

    // Return user without password
    const { PASSWORD, KEYP, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      message: 'Failed to create user',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Public (MVP)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      name,
      email,
      phone,
      role,
      status
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Update user
    await user.update({
      NAME: name,
      EMAIL: email,
      PHONE: phone,
      ROLE: role,
      STATUS: status,
      STAMP: new Date()
    });

    // Return user without password
    const { PASSWORD, KEYP, ...userWithoutPassword } = user.toJSON();

    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: 'Failed to update user',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status
// @access  Public (MVP)
router.put('/:id/status', async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    await user.update({
      STATUS: status,
      STAMP: new Date()
    });

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user.ID,
        status: user.STATUS
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: 'Failed to update user status',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Public (MVP)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Soft delete by updating status
    await user.update({
      STATUS: 'inactive',
      STAMP: new Date()
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Failed to delete user',
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;