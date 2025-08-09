const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Contact, Opportunity, Task, User } = require('../models');

const router = express.Router();

// Mock user for MVP (authentication disabled)
const getMockUser = () => ({
  id: 1,
  userId: 1,
  role: 'admin',
  userRole: 'admin'
});

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview statistics
// @access  Public (Authentication disabled for MVP)
router.get('/overview', async (req, res) => {
  try {
    const mockUser = getMockUser();
    console.log('Dashboard overview request:', {
      query: req.query,
      user: mockUser
    });
    
    const userId = mockUser.userId;
    const userRole = mockUser.userRole;
    
    // Base statistics
    const totalContacts = await Contact.count({
      where: userRole === 'admin' ? {} : { USERID: userId }
    });
    
    const totalOpportunities = await Opportunity.count({
      where: userRole === 'admin' ? {} : { USERID: userId }
    });
    
    const totalTasks = await Task.count({
      where: userRole === 'admin' ? {} : { USERID: userId }
    });
    
    // Active opportunities (using STATUSTYPEID)
    const activeOpportunities = await Opportunity.count({
      where: {
        STATUSTYPEID: 1, // Assuming 1 = active
        ...(userRole === 'admin' ? {} : { USERID: userId })
      }
    });
    
    // Pending tasks
    const pendingTasks = await Task.count({
      where: {
        STATUS: { [Op.in]: ['New', ''] },
        ...(userRole === 'admin' ? {} : { USERID: userId })
      }
    });
    
    // Total revenue this month - sum all opportunities with FINALTOTAL > 0
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const totalRevenue = await Opportunity.sum('FINALTOTAL', {
      where: {
        FINALTOTAL: { [Op.gt]: 0 },
        STAMP: {
          [Op.gte]: currentMonth
        },
        ...(userRole === 'admin' ? {} : { USERID: userId })
      }
    }) || 0;
    
    console.log('Overview results:', {
      totalContacts,
      totalOpportunities,
      totalTasks,
      activeOpportunities,
      pendingTasks,
      totalRevenue
    });
    
    res.json({
      overview: {
        totalContacts,
        totalOpportunities,
        totalTasks,
        activeOpportunities,
        pendingTasks,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      parameters: error.parameters
    });
    res.status(500).json({
      message: 'Failed to fetch dashboard overview',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   GET /api/dashboard/pipeline
// @desc    Get sales pipeline data
// @access  Public (Authentication disabled for MVP)
router.get('/pipeline', async (req, res) => {
  try {
    const mockUser = getMockUser();
    const userId = mockUser.userId;
    const userRole = mockUser.userRole;
    
    const pipeline = await Opportunity.getSalesPipeline(
      userRole === 'admin' ? null : userId
    );
    
    res.json({ pipeline });
  } catch (error) {
    console.error('Get sales pipeline error:', error);
    res.status(500).json({
      message: 'Failed to fetch sales pipeline',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/dashboard/tasks-summary
// @desc    Get task summary by status and priority
// @access  Public (Authentication disabled for MVP)
router.get('/tasks-summary', async (req, res) => {
  try {
    const mockUser = getMockUser();
    const userId = mockUser.userId;
    const userRole = mockUser.userRole;
    
    const whereClause = userRole === 'admin' ? {} : { USERID: userId };
    
    // Tasks by status
    const tasksByStatus = {
      pending: await Task.count({ where: { ...whereClause, STATUS: { [Op.in]: ['New', ''] } } }),
      in_progress: await Task.count({ where: { ...whereClause, STATUS: 'In progress' } }),
      completed: await Task.count({ where: { ...whereClause, STATUS: 'Completed' } }),
      cancelled: await Task.count({ where: { ...whereClause, STATUS: 'cancelled' } })
    };
    
    res.json({
      taskSummary: {
        byStatus: tasksByStatus
      }
    });
  } catch (error) {
    console.error('Get task summary error:', error);
    res.status(500).json({
      message: 'Failed to fetch task summary',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/dashboard/revenue
// @desc    Get revenue data for charts (last 12 months)
// @access  Public (Authentication disabled for MVP)
router.get('/revenue', async (req, res) => {
  try {
    const mockUser = getMockUser();
    const userId = mockUser.userId;
    const userRole = mockUser.userRole;
    
    const months = [];
    const revenueData = [];
    
    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push(monthName);
      
      const monthRevenue = await Opportunity.findAll({
        where: {
          FINALTOTAL: { [Op.gt]: 0 },
          STAMP: {
            [Op.gte]: date,
            [Op.lt]: nextMonth
          },
          ...(userRole === 'admin' ? {} : { USERID: userId })
        },
        attributes: ['FINALTOTAL']
      });
      
      const totalRevenue = monthRevenue.reduce((sum, opp) => {
        const amount = opp.FINALTOTAL;
        return sum + (amount != null && !isNaN(amount) ? parseFloat(amount) : 0);
      }, 0);
      revenueData.push(totalRevenue);
    }
    
    res.json({
      revenueChart: {
        months,
        revenue: revenueData
      }
    });
  } catch (error) {
    console.error('Get revenue chart error:', error);
    res.status(500).json({
      message: 'Failed to fetch revenue chart data',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/dashboard/activities
// @desc    Get recent activities (contacts, opportunities, tasks)
// @access  Public (Authentication disabled for MVP)
router.get('/activities', async (req, res) => {
  try {
    const mockUser = getMockUser();
    const userId = mockUser.userId;
    const userRole = mockUser.userRole;
    const limit = parseInt(req.query.limit) || 10;
    
    // Recent contacts
    const recentContacts = await Contact.findAll({
      where: userRole === 'admin' ? {} : { USERID: userId },
      order: [['DATETIME', 'DESC']],
      limit: limit
    });
    
    // Recent opportunities
    const recentOpportunities = await Opportunity.findAll({
      where: userRole === 'admin' ? {} : { USERID: userId },
      order: [['DATETIME', 'DESC']],
      limit: limit
    });
    
    // Recent tasks
    const recentTasks = await Task.findAll({
      where: userRole === 'admin' ? {} : { USERID: userId },
      order: [['DATETIME', 'DESC']],
      limit: limit
    });
    
    res.json({
      recentActivities: {
        contacts: recentContacts,
        opportunities: recentOpportunities,
        tasks: recentTasks
      }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      message: 'Failed to fetch recent activities',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/dashboard/upcoming-tasks
// @desc    Get upcoming tasks (next 7 days)
// @access  Public (Authentication disabled for MVP)
router.get('/upcoming-tasks', async (req, res) => {
  try {
    const mockUser = getMockUser();
    const userId = mockUser.userId;
    const userRole = mockUser.userRole;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent active tasks since most DATETIMEDUE are null
    const upcomingTasks = await Task.findAll({
      where: {
        STATUS: {
          [Op.in]: ['New', 'In progress', '']
        },
        ...(userRole === 'admin' ? {} : { USERID: userId })
      },
      order: [
        [sequelize.fn('COALESCE', sequelize.col('DATETIMEDUE'), sequelize.col('STAMP')), 'DESC'],
        ['TYPEID', 'DESC']
      ],
      limit
    });
    
    res.json({
      upcomingTasks
    });
  } catch (error) {
    console.error('Get upcoming tasks error:', error);
    res.status(500).json({
      message: 'Failed to fetch upcoming tasks',
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;