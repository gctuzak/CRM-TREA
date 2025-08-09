const express = require('express');
const { Op } = require('sequelize');
const { Opportunity, Contact, User, Task } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateOpportunity, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/opportunities
// @desc    Get all opportunities with pagination and filters
// @access  Public (Authentication disabled for MVP)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status;
    const offset = (page - 1) * limit;

    const result = await Opportunity.findWithPagination({
      limit,
      offset,
      search,
      status
    });

    const totalPages = Math.ceil(result.count / limit);

    res.json({
      opportunities: result.rows,
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
    console.error('Get opportunities error:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      parameters: error.parameters
    });
    res.status(500).json({
      message: 'Failed to fetch opportunities',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   GET /api/opportunities/pipeline
// @desc    Get sales pipeline (opportunities grouped by stage)
// @access  Private
router.get('/pipeline', authenticateToken, async (req, res) => {
  try {
    const assignedUserId = req.query.assignedUserId;
    
    const whereClause = { STATUS: 'active' };
    if (assignedUserId) {
      whereClause.ASSIGNED_USER_ID = assignedUserId;
    }

    const opportunities = await Opportunity.findAll({
      where: whereClause,
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['ID', 'NAME', 'COMPANY']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['ID', 'NAME']
        }
      ],
      order: [['STAGE', 'ASC'], ['CREATED_DATE', 'DESC']]
    });

    // Group opportunities by stage
    const pipeline = {
      new: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      closed_won: [],
      closed_lost: []
    };

    opportunities.forEach(opp => {
      if (pipeline[opp.STAGE]) {
        pipeline[opp.STAGE].push(opp);
      }
    });

    // Calculate stage statistics
    const stats = {
      totalValue: opportunities.reduce((sum, opp) => sum + parseFloat(opp.AMOUNT || 0), 0),
      totalCount: opportunities.length,
      stageStats: Object.keys(pipeline).map(stage => ({
        stage,
        count: pipeline[stage].length,
        value: pipeline[stage].reduce((sum, opp) => sum + parseFloat(opp.AMOUNT || 0), 0)
      }))
    };

    res.json({
      pipeline,
      stats
    });
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({
      message: 'Failed to fetch sales pipeline',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/opportunities/my
// @desc    Get current user's opportunities
// @access  Private
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stage = req.query.stage;
    
    const whereClause = { ASSIGNED_USER_ID: userId };
    if (stage) {
      whereClause.STAGE = stage;
    }

    const opportunities = await Opportunity.findAll({
      where: whereClause,
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['ID', 'NAME', 'COMPANY']
        }
      ],
      order: [['EXPECTED_CLOSE_DATE', 'ASC']]
    });

    res.json({ opportunities });
  } catch (error) {
    console.error('Get my opportunities error:', error);
    res.status(500).json({
      message: 'Failed to fetch your opportunities',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/opportunities/:id
// @desc    Get opportunity by ID with full details
// @access  Public (Authentication disabled for MVP)
router.get('/:id', async (req, res) => {
  try {
    const opportunityId = req.params.id;

    const result = await Opportunity.getWithContactInfo(opportunityId);

    if (!result || !result.opportunity) {
      return res.status(404).json({
        message: 'Opportunity not found',
        error: 'OPPORTUNITY_NOT_FOUND'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({
      message: 'Failed to fetch opportunity',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/opportunities
// @desc    Create new opportunity
// @access  Public (Authentication disabled for MVP)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      note,
      contactId,
      clientId,
      statusTypeId,
      ownerUserId,
      userId,
      leadId,
      usdRate,
      eurRate,
      discountPer,
      discountAmn,
      subtotal,
      totalCost,
      finalTotal,
      currency,
      vatPer1,
      vatValue1,
      vatInclude
    } = req.body;

    const opportunity = await Opportunity.create({
      NAME: name,
      NOTE: note || '',
      CONTACTID: contactId || 0,
      CLIENTID: clientId || 0,
      STATUSTYPEID: statusTypeId || 1,
      OWNERUSERID: ownerUserId || 1,
      USERID: userId || 1,
      DATETIME: new Date(),
      ORID: Math.floor(Math.random() * 1000000), // Temporary ORID generation
      DATETIMEEDIT: new Date(),
      USERIDEDIT: 1,
      LEADID: leadId || 0,
      USDRATE: usdRate || '0',
      EURRATE: eurRate || '0',
      DISCOUNTPER: discountPer || '0',
      DISCOUNTAMN: discountAmn || '0',
      SUBTOTAL: subtotal || '0',
      TOTALCOST: totalCost || '0',
      FINALTOTAL: finalTotal || '0',
      CURRENCY: currency || 'TRY',
      VATPER1: vatPer1 || '0',
      VATVALUE1: vatValue1 || '0',
      VATINCLUDE: vatInclude || '0'
    });

    res.status(201).json({
      message: 'Opportunity created successfully',
      opportunity
    });
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({
      message: 'Failed to create opportunity',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   PUT /api/opportunities/:id
// @desc    Update opportunity
// @access  Public (Authentication disabled for MVP)
router.put('/:id', async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const {
      name,
      note,
      contactId,
      clientId,
      statusTypeId,
      ownerUserId,
      userId,
      leadId,
      usdRate,
      eurRate,
      discountPer,
      discountAmn,
      subtotal,
      totalCost,
      finalTotal,
      currency,
      vatPer1,
      vatValue1,
      vatInclude
    } = req.body;

    const opportunity = await Opportunity.findByPk(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        message: 'Opportunity not found',
        error: 'OPPORTUNITY_NOT_FOUND'
      });
    }

    // Update opportunity
    await opportunity.update({
      NAME: name,
      NOTE: note,
      CONTACTID: contactId,
      CLIENTID: clientId,
      STATUSTYPEID: statusTypeId,
      OWNERUSERID: ownerUserId,
      USERID: userId,
      DATETIMEEDIT: new Date(),
      USERIDEDIT: 1,
      LEADID: leadId,
      USDRATE: usdRate,
      EURRATE: eurRate,
      DISCOUNTPER: discountPer,
      DISCOUNTAMN: discountAmn,
      SUBTOTAL: subtotal,
      TOTALCOST: totalCost,
      FINALTOTAL: finalTotal,
      CURRENCY: currency,
      VATPER1: vatPer1,
      VATVALUE1: vatValue1,
      VATINCLUDE: vatInclude
    });

    res.json({
      message: 'Opportunity updated successfully',
      opportunity
    });
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({
      message: 'Failed to update opportunity',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   PUT /api/opportunities/:id/stage
// @desc    Update opportunity stage (for Kanban board)
// @access  Private
router.put('/:id/stage', authenticateToken, validateId, async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const { stage } = req.body;

    const validStages = ['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({
        message: 'Invalid stage value',
        error: 'INVALID_STAGE',
        validStages
      });
    }

    const opportunity = await Opportunity.findByPk(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        message: 'Opportunity not found',
        error: 'OPPORTUNITY_NOT_FOUND'
      });
    }

    // Update stage and related fields
    const updateData = {
      STAGE: stage,
      UPDATED_DATE: new Date()
    };

    // Auto-update status based on stage
    if (stage === 'closed_won') {
      updateData.STATUS = 'won';
      updateData.ACTUAL_CLOSE_DATE = new Date();
    } else if (stage === 'closed_lost') {
      updateData.STATUS = 'lost';
      updateData.ACTUAL_CLOSE_DATE = new Date();
    }

    await opportunity.update(updateData);

    res.json({
      message: 'Opportunity stage updated successfully',
      opportunity: {
        id: opportunity.ID,
        stage: opportunity.STAGE,
        status: opportunity.STATUS,
        actualCloseDate: opportunity.ACTUAL_CLOSE_DATE
      }
    });
  } catch (error) {
    console.error('Update opportunity stage error:', error);
    res.status(500).json({
      message: 'Failed to update opportunity stage',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   DELETE /api/opportunities/:id
// @desc    Delete opportunity
// @access  Public (Authentication disabled for MVP)
router.delete('/:id', async (req, res) => {
  try {
    const opportunityId = req.params.id;

    const opportunity = await Opportunity.findByPk(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        message: 'Opportunity not found',
        error: 'OPPORTUNITY_NOT_FOUND'
      });
    }

    // Hard delete for now (can be changed to soft delete later)
    await opportunity.destroy();

    res.json({
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({
      message: 'Failed to delete opportunity',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/opportunities/stats/summary
// @desc    Get opportunity statistics
// @access  Private
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const totalOpportunities = await Opportunity.count({ where: { STATUS: 'active' } });
    const wonOpportunities = await Opportunity.count({ where: { STATUS: 'won' } });
    const lostOpportunities = await Opportunity.count({ where: { STATUS: 'lost' } });
    
    // Calculate total value
    const totalValue = await Opportunity.sum('AMOUNT', { where: { STATUS: 'active' } }) || 0;
    const wonValue = await Opportunity.sum('AMOUNT', { where: { STATUS: 'won' } }) || 0;
    
    // Win rate
    const totalClosed = wonOpportunities + lostOpportunities;
    const winRate = totalClosed > 0 ? (wonOpportunities / totalClosed * 100).toFixed(2) : 0;

    res.json({
      stats: {
        totalOpportunities,
        wonOpportunities,
        lostOpportunities,
        totalValue,
        wonValue,
        winRate: parseFloat(winRate)
      }
    });
  } catch (error) {
    console.error('Get opportunity stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch opportunity statistics',
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;