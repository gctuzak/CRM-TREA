const express = require('express');
const { Op } = require('sequelize');
const { Contact, ContactEmail, ContactPhone, ContactFieldValue, Opportunity, Task } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateContact, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/contacts
// @desc    Get all contacts with pagination and advanced search
// @access  Public (Authentication disabled)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const email = req.query.email || '';
    const phone = req.query.phone || '';
    const company = req.query.company || '';
    const offset = (page - 1) * limit;

    const startTime = Date.now();

    const result = await Contact.findWithPagination({
      limit,
      offset,
      search,
      email,
      phone,
      company
    });

    const searchTime = Date.now() - startTime;
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
      },
      searchQuery: search,
      searchFilters: {
        email,
        phone,
        company
      },
      totalMatches: result.count,
      searchTime
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
// @desc    Advanced search contacts with multiple criteria
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q, email, phone, company, page = 1, limit = 20 } = req.query;
    
    // Validate that at least one search parameter is provided
    if (!q && !email && !phone && !company) {
      return res.status(400).json({
        message: 'At least one search parameter is required',
        error: 'INVALID_SEARCH_QUERY'
      });
    }

    // Validate search query length if provided
    if (q && q.trim().length < 2) {
      return res.status(400).json({
        message: 'Search query must be at least 2 characters long',
        error: 'INVALID_SEARCH_QUERY'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const startTime = Date.now();

    const result = await Contact.findWithPagination({
      limit: limitNum,
      offset,
      search: q ? q.trim() : '',
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      company: company ? company.trim() : ''
    });

    const searchTime = Date.now() - startTime;
    const totalPages = Math.ceil(result.count / limitNum);
    
    res.json({ 
      contacts: result.rows,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: result.count,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      searchQuery: q || '',
      searchFilters: {
        email: email || '',
        phone: phone || '',
        company: company || ''
      },
      totalMatches: result.count,
      searchTime
    });
  } catch (error) {
    console.error('Search contacts error:', error);
    res.status(500).json({
      message: 'Failed to search contacts',
      error: 'SERVER_ERROR',
      details: error.message
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
      coordinate,
      tckn,
      vkn,
      taxOffice
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

    // Update custom fields (TC Kimlik No, Vergi No, Vergi Dairesi)
    const customFieldUpdates = [];
    
    if (tckn !== undefined) {
      customFieldUpdates.push({
        fieldId: 30, // TC Kimlik No
        value: tckn
      });
    }
    
    if (vkn !== undefined) {
      customFieldUpdates.push({
        fieldId: 28, // Vergi No
        value: vkn
      });
    }
    
    if (taxOffice !== undefined) {
      customFieldUpdates.push({
        fieldId: 29, // Vergi Dairesi
        value: taxOffice
      });
    }

    // Update custom field values
    for (const fieldUpdate of customFieldUpdates) {
      if (fieldUpdate.value && fieldUpdate.value.trim()) {
        await ContactFieldValue.upsert({
          FIELDID: fieldUpdate.fieldId,
          CONTACTID: contactId,
          VALUE: fieldUpdate.value.trim(),
          ORID: contact.ORID,
          USERID: 1,
          DATETIMEEDIT: new Date()
        });
      } else {
        // Delete if value is empty
        await ContactFieldValue.destroy({
          where: {
            FIELDID: fieldUpdate.fieldId,
            CONTACTID: contactId,
            ORID: contact.ORID
          }
        });
      }
    }

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

// @route   POST /api/contacts/:id/emails
// @desc    Add email to contact
// @access  Private
router.post('/:id/emails', async (req, res) => {
  try {
    const contactId = req.params.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        error: 'VALIDATION_ERROR'
      });
    }

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    const contactEmail = await ContactEmail.create({
      CONTACTID: contactId,
      EMAIL: email,
      ORID: contact.ORID,
      USERID: 1,
      DATETIMEEDIT: new Date()
    });

    res.status(201).json({
      message: 'Email added successfully',
      email: contactEmail
    });
  } catch (error) {
    console.error('Add email error:', error);
    res.status(500).json({
      message: 'Failed to add email',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   PUT /api/contacts/:id/emails/:emailId
// @desc    Update contact email
// @access  Private
router.put('/:id/emails/:emailId', async (req, res) => {
  try {
    const { id: contactId, emailId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        error: 'VALIDATION_ERROR'
      });
    }

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    const contactEmail = await ContactEmail.findOne({
      where: {
        ID: emailId,
        CONTACTID: contactId,
        ORID: contact.ORID
      }
    });

    if (!contactEmail) {
      return res.status(404).json({
        message: 'Email not found',
        error: 'EMAIL_NOT_FOUND'
      });
    }

    await contactEmail.update({
      EMAIL: email,
      DATETIMEEDIT: new Date()
    });

    res.json({
      message: 'Email updated successfully',
      email: contactEmail
    });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({
      message: 'Failed to update email',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   DELETE /api/contacts/:id/emails/:emailId
// @desc    Delete contact email
// @access  Private
router.delete('/:id/emails/:emailId', async (req, res) => {
  try {
    const { id: contactId, emailId } = req.params;

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    const contactEmail = await ContactEmail.findOne({
      where: {
        ID: emailId,
        CONTACTID: contactId,
        ORID: contact.ORID
      }
    });

    if (!contactEmail) {
      return res.status(404).json({
        message: 'Email not found',
        error: 'EMAIL_NOT_FOUND'
      });
    }

    await contactEmail.destroy();

    res.json({
      message: 'Email deleted successfully'
    });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      message: 'Failed to delete email',
      error: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/contacts/:id/phones
// @desc    Add phone to contact
// @access  Private
router.post('/:id/phones', async (req, res) => {
  try {
    const contactId = req.params.id;
    const { number, type } = req.body;

    if (!number) {
      return res.status(400).json({
        message: 'Phone number is required',
        error: 'VALIDATION_ERROR'
      });
    }

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    const contactPhone = await ContactPhone.create({
      CONTACTID: contactId,
      NUMBER: number,
      CONTROLNUMBER: number.replace(/\D/g, '').substring(0, 20), // Remove non-digits and limit to 20 chars
      TYPE: type || 'mobile',
      ORID: contact.ORID,
      USERID: 1,
      DATETIMEEDIT: new Date()
    });

    res.status(201).json({
      message: 'Phone added successfully',
      phone: contactPhone
    });
  } catch (error) {
    console.error('Add phone error:', error);
    res.status(500).json({
      message: 'Failed to add phone',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   PUT /api/contacts/:id/phones/:phoneId
// @desc    Update contact phone
// @access  Private
router.put('/:id/phones/:phoneId', async (req, res) => {
  try {
    const { id: contactId, phoneId } = req.params;
    const { number, type } = req.body;

    if (!number) {
      return res.status(400).json({
        message: 'Phone number is required',
        error: 'VALIDATION_ERROR'
      });
    }

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    const contactPhone = await ContactPhone.findOne({
      where: {
        ID: phoneId,
        CONTACTID: contactId,
        ORID: contact.ORID
      }
    });

    if (!contactPhone) {
      return res.status(404).json({
        message: 'Phone not found',
        error: 'PHONE_NOT_FOUND'
      });
    }

    await contactPhone.update({
      NUMBER: number,
      CONTROLNUMBER: number.replace(/\D/g, '').substring(0, 20), // Remove non-digits and limit to 20 chars
      TYPE: type || contactPhone.TYPE,
      DATETIMEEDIT: new Date()
    });

    res.json({
      message: 'Phone updated successfully',
      phone: contactPhone
    });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({
      message: 'Failed to update phone',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// @route   DELETE /api/contacts/:id/phones/:phoneId
// @desc    Delete contact phone
// @access  Private
router.delete('/:id/phones/:phoneId', async (req, res) => {
  try {
    const { id: contactId, phoneId } = req.params;

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        error: 'CONTACT_NOT_FOUND'
      });
    }

    const contactPhone = await ContactPhone.findOne({
      where: {
        ID: phoneId,
        CONTACTID: contactId,
        ORID: contact.ORID
      }
    });

    if (!contactPhone) {
      return res.status(404).json({
        message: 'Phone not found',
        error: 'PHONE_NOT_FOUND'
      });
    }

    await contactPhone.destroy();

    res.json({
      message: 'Phone deleted successfully'
    });
  } catch (error) {
    console.error('Delete phone error:', error);
    res.status(500).json({
      message: 'Failed to delete phone',
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