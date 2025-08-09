const express = require('express');
const { Op } = require('sequelize');
const { Contact, ContactEmail, ContactPhone, Opportunity, Task } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateContact, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/contacts
// @desc    Get all contacts with pagination and search
// @access  Public (Authentication disabled)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const result = await Contact.findWithPagination({
      limit,
      offset,
      search
    });

    const totalPages = Math.ceil(result.count / limit);

    res.json({
      contacts: result.rows,
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
    console.error('Get contacts error:', error.stack || error.message);
    res.status(500).json({
      message: 'Failed to fetch contacts',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   GET /api/contacts/recent
// @desc    Get recent contacts
// @access  Private
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const contacts = await Contact.getRecentContacts(limit);
    
    res.json({ contacts });
  } catch (error) {
    console.error('Get recent contacts error:', error);
    res.status(500).json({
      message: 'Failed to fetch recent contacts',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/contacts/search
// @desc    Search contacts
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: 'Search query must be at least 2 characters long',
        error: 'INVALID_SEARCH_QUERY'
      });
    }

    const contacts = await Contact.searchByName(q.trim());
    
    res.json({ contacts });
  } catch (error) {
    console.error('Search contacts error:', error);
    res.status(500).json({
      message: 'Failed to search contacts',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/contacts/:id
// @desc    Get contact by ID with full details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const contactId = req.params.id;
    console.log('Getting contact with ID:', contactId);

    const result = await Contact.getWithRelatedData(contactId);
    
    console.log('Result from getWithRelatedData:', result);
    console.log('Result emails:', result?.emails?.length || 0);
    console.log('Result phones:', result?.phones?.length || 0);

    if (!result || !result.contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    console.log('Sending response with emails:', result.emails.length, 'phones:', result.phones.length);
    res.json(result);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      message: 'Failed to fetch contact',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/contacts
// @desc    Create new contact
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      name,
      controlName,
      type,
      title,
      jobTitle,
      address,
      city,
      state,
      country,
      zip,
      parentContactId,
      parentContactName,
      note,
      organizationTypeId,
      position,
      coordinate
    } = req.body;

    // Create contact
    const contact = await Contact.create({
      NAME: name,
      CONTROLNAME: controlName || '',
      TYPE: type || '',
      TITLE: title || '',
      JOBTITLE: jobTitle || '',
      ADDRESS: address || '',
      CITY: city || '',
      STATE: state || '',
      COUNTRY: country || '',
      ZIP: zip || '',
      PARENTCONTACTID: parentContactId || null,
      PARENTCONTACTNAME: parentContactName || '',
      NOTE: note || '',
      ORGANIZATIONTYPEID: organizationTypeId || 0,
      ORID: Math.floor(Math.random() * 1000000), // Temporary ORID generation
      USERID: 1, // Default admin user
      DATETIME: new Date(),
      DATETIMEEDIT: new Date(),
      USERIDEDIT: 1,
      POSITION: position || '',
      COORDINATE: coordinate || ''
    });

    res.status(201).json({
      message: 'Contact created successfully',
      contact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      message: 'Failed to create contact',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const contactId = req.params.id;
    const {
      name,
      controlName,
      type,
      title,
      jobTitle,
      address,
      city,
      state,
      country,
      zip,
      parentContactId,
      parentContactName,
      note,
      organizationTypeId,
      position,
      coordinate
    } = req.body;

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    // Update contact
    await contact.update({
      NAME: name,
      CONTROLNAME: controlName,
      TYPE: type,
      TITLE: title,
      JOBTITLE: jobTitle,
      ADDRESS: address,
      CITY: city,
      STATE: state,
      COUNTRY: country,
      ZIP: zip,
      PARENTCONTACTID: parentContactId,
      PARENTCONTACTNAME: parentContactName,
      NOTE: note,
      ORGANIZATIONTYPEID: organizationTypeId,
      DATETIMEEDIT: new Date(),
      USERIDEDIT: 1,
      POSITION: position,
      COORDINATE: coordinate
    });

    res.json({
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      message: 'Failed to update contact',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete contact
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const contactId = req.params.id;

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    // Hard delete for now (can be changed to soft delete later)
    await contact.destroy();

    res.json({
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      message: 'Failed to delete contact',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/contacts/stats/summary
// @desc    Get contact statistics
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const totalContacts = await Contact.count({ where: { STATUS: 'active' } });
    const prospects = await Contact.count({ where: { STATUS: 'prospect' } });
    const customers = await Contact.count({ where: { STATUS: 'customer' } });
    
    // Recent contacts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentContacts = await Contact.count({
      where: {
        CREATED_DATE: { [Op.gte]: thirtyDaysAgo },
        STATUS: 'active'
      }
    });

    res.json({
      stats: {
        totalContacts,
        prospects,
        customers,
        recentContacts
      }
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch contact statistics',
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;