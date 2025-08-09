const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Task, Contact, User, Opportunity, TaskType } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateTask, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/tasks/types
// @desc    Get all task types
// @access  Public
router.get('/types', async (req, res) => {
  try {
    const taskTypes = await TaskType.findAll({
      attributes: ['ID', 'NAME'],
      order: [['NAME', 'ASC']]
    });
    
    res.json({
      taskTypes
    });
  } catch (error) {
    console.error('Get task types error:', error);
    res.status(500).json({
      message: 'Failed to fetch task types',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks with pagination and filters
// @access  Public (Authentication disabled for MVP)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status;
    const userId = req.query.userId;
    const offset = (page - 1) * limit;

    const { count, rows } = await Task.findAndCountAll({
      where: {
        ...(search ? { NOTE: { [Op.like]: `%${search}%` } } : {}),
        ...(status ? { STATUS: status } : {}),
        ...(userId ? { USERID: userId } : {})
      },
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['ID', 'NAME'],
          required: false
        },
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['ID', 'NAME'],
          required: false
        },
        {
          model: TaskType,
          as: 'taskType',
          attributes: ['ID', 'NAME'],
          required: false
        }
      ],
      order: [['DATETIME', 'DESC']],
      limit,
      offset
    });

    const result = { count, rows };

    const totalPages = Math.ceil(result.count / limit);

    res.json({
      tasks: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: result.count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get tasks error:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      parameters: error.parameters
    });
    res.status(500).json({
      message: 'Failed to fetch tasks',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   GET /api/tasks/my
// @desc    Get current user's tasks
// @access  Private
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status;
    
    const whereClause = { ASSIGNED_USER_ID: userId };
    if (status) {
      whereClause.STATUS = status;
    }

    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['ID', 'NAME', 'COMPANY']
        },
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['ID', 'TITLE', 'STAGE']
        }
      ],
      order: [['DUE_DATE', 'ASC'], ['PRIORITY', 'DESC']]
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      message: 'Failed to fetch your tasks',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/tasks/due-today
// @desc    Get tasks due today
// @access  Public (Authentication disabled for MVP)
router.get('/due-today', async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const result = await Task.findDueToday(userId, { limit, offset });

    const totalPages = Math.ceil(result.count / limit);

    res.json({
      tasks: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: result.count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get due today tasks error:', error);
    res.status(500).json({
      message: 'Failed to fetch tasks due today',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/tasks/overdue
// @desc    Get overdue tasks
// @access  Public (Authentication disabled for MVP)
router.get('/overdue', async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const result = await Task.findOverdue(userId, { limit, offset });

    const totalPages = Math.ceil(result.count / limit);

    res.json({
      tasks: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: result.count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({
      message: 'Failed to fetch overdue tasks',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/tasks/by-contact/:contactId
// @desc    Get tasks for a specific contact
// @access  Private
router.get('/by-contact/:contactId', authenticateToken, validateId, async (req, res) => {
  try {
    const contactId = req.params.contactId;
    
    const tasks = await Task.findByContact(contactId);
    
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks by contact error:', error);
    res.status(500).json({
      message: 'Failed to fetch tasks for contact',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/tasks/by-opportunity/:opportunityId
// @desc    Get tasks for a specific opportunity
// @access  Private
router.get('/by-opportunity/:opportunityId', authenticateToken, validateId, async (req, res) => {
  try {
    const opportunityId = req.params.opportunityId;
    
    const tasks = await Task.findByOpportunity(opportunityId);
    
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks by opportunity error:', error);
    res.status(500).json({
      message: 'Failed to fetch tasks for opportunity',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID with full details
// @access  Private
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['ID', 'NAME', 'COMPANY']
        },
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['ID', 'TITLE', 'STAGE', 'AMOUNT']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['ID', 'NAME', 'EMAIL']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['ID', 'NAME', 'EMAIL']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      message: 'Failed to fetch task',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Public (Authentication disabled for MVP)
router.post('/', async (req, res) => {
  try {
    const {
      note,
      status,
      typeId,
      contactId,
      opportunityId,
      leadId,
      jobId,
      parentTaskId,
      userId,
      datetimeDue,
      recur,
      recurDueDate,
      googleTaskId
    } = req.body;

    const task = await Task.create({
      USERID: userId || 1,
      DATETIME: new Date(),
      DATETIMEDUE: datetimeDue || null,
      NOTE: note || '',
      STATUS: status || 'New',
      TYPEID: typeId || 0,
      CONTACTID: contactId || null,
      OPPORTUNITYID: opportunityId || 0,
      LEADID: leadId || 0,
      JOBID: jobId || 0,
      ORID: Math.floor(Math.random() * 1000000), // Temporary ORID generation
      DATETIMEEDIT: new Date(),
      USERIDEDIT: 1,
      PARENTTASKID: parentTaskId || 0,
      RECUR: recur || null,
      RECURDUEDATE: recurDueDate || null,
      GOOGLETASKID: googleTaskId || null
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      message: 'Failed to create task',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Public (Authentication disabled for MVP)
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const {
      note,
      status,
      typeId,
      contactId,
      opportunityId,
      leadId,
      jobId,
      parentTaskId,
      userId,
      datetimeDue,
      recur,
      recurDueDate,
      googleTaskId
    } = req.body;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    // Update task
    await task.update({
      NOTE: note,
      STATUS: status,
      TYPEID: typeId,
      CONTACTID: contactId,
      OPPORTUNITYID: opportunityId,
      LEADID: leadId,
      JOBID: jobId,
      PARENTTASKID: parentTaskId,
      USERID: userId,
      DATETIMEDUE: datetimeDue,
      RECUR: recur,
      RECURDUEDATE: recurDueDate,
      GOOGLETASKID: googleTaskId,
      DATETIMEEDIT: new Date(),
      USERIDEDIT: 1
    });

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      message: 'Failed to update task',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   PUT /api/tasks/:id/complete
// @desc    Mark task as completed
// @access  Private
router.put('/:id/complete', authenticateToken, validateId, async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    await task.markCompleted();

    res.json({
      message: 'Task marked as completed',
      task: {
        id: task.ID,
        status: task.STATUS,
        completedDate: task.COMPLETED_DATE
      }
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      message: 'Failed to complete task',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Public (Authentication disabled for MVP)
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    // Hard delete for now (can be changed to soft delete later)
    await task.destroy();

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      message: 'Failed to delete task',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/tasks/stats/summary
// @desc    Get task statistics
// @access  Private
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    
    const whereClause = userId ? { ASSIGNED_USER_ID: userId } : {};
    
    const totalTasks = await Task.count({ where: whereClause });
    const pendingTasks = await Task.count({ where: { ...whereClause, STATUS: 'pending' } });
    const inProgressTasks = await Task.count({ where: { ...whereClause, STATUS: 'in_progress' } });
    const completedTasks = await Task.count({ where: { ...whereClause, STATUS: 'completed' } });
    
    // Overdue tasks
    const overdueTasks = await Task.findOverdue();
    const overdueCount = userId ? overdueTasks.filter(task => task.ASSIGNED_USER_ID == userId).length : overdueTasks.length;
    
    // Due today tasks
    const dueTodayTasks = await Task.findDueToday();
    const dueTodayCount = userId ? dueTodayTasks.filter(task => task.ASSIGNED_USER_ID == userId).length : dueTodayTasks.length;

    res.json({
      stats: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueCount,
        dueTodayCount
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch task statistics',
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;