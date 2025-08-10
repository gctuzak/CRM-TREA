const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
// Ensure related models are available for includes used below
const ContactEmail = require('./ContactEmail');
const ContactPhone = require('./ContactPhone');
const ContactFieldValue = require('./ContactFieldValue');

const Contact = sequelize.define('CONTACT', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  NAME: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  CONTROLNAME: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  TYPE: {
    type: DataTypes.ENUM('P', 'O'),
    allowNull: false
  },
  TITLE: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  JOBTITLE: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  ADDRESS: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  CITY: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  STATE: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  COUNTRY: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  ZIP: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  PARENTCONTACTID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  PARENTCONTACTNAME: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: ''
  },
  NOTE: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ORGANIZATIONTYPEID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ORID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  USERID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  DATETIME: {
    type: DataTypes.DATE,
    allowNull: false
  },
  DATETIMEEDIT: {
    type: DataTypes.DATE,
    allowNull: false
  },
  USERIDEDIT: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  GOOGLEID: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  POSITION: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  COORDINATE: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  STAMP: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CONTACT',
  timestamps: false,
  hooks: {
    beforeUpdate: (contact) => {
      contact.STAMP = new Date();
    }
  }
});

// Instance methods
Contact.prototype.getFullName = function() {
  return this.NAME;
};

Contact.prototype.getDisplayName = function() {
  const fullName = this.getFullName();
  return this.COMPANY ? `${fullName} (${this.COMPANY})` : fullName;
};

// Class methods
Contact.searchByName = function(searchTerm, options = {}) {
  const { Op } = require('sequelize');
  const ContactEmail = require('./ContactEmail');
  const ContactPhone = require('./ContactPhone');
  const { limit = 20, offset = 0 } = options;
  
  return this.findAndCountAll({
    where: {
      [Op.or]: [
        { NAME: { [Op.like]: `%${searchTerm}%` } },
        { JOBTITLE: { [Op.like]: `%${searchTerm}%` } },
        { PARENTCONTACTNAME: { [Op.like]: `%${searchTerm}%` } },
        { '$emails.EMAIL$': { [Op.like]: `%${searchTerm}%` } },
        { '$phones.NUMBER$': { [Op.like]: `%${searchTerm}%` } }
      ]
    },
    include: [
      {
        model: ContactEmail,
        as: 'emails',
        attributes: ['ID', 'EMAIL', 'CONTACTID', 'ORID', 'USERID'],
        where: {
          ORID: { [Op.col]: 'CONTACT.ORID' }
        },
        required: false
      },
      {
        model: ContactPhone,
        as: 'phones',
        attributes: ['ID', 'NUMBER', 'CONTROLNUMBER', 'TYPE', 'CONTACTID', 'ORID', 'USERID'],
        where: {
          ORID: { [Op.col]: 'CONTACT.ORID' }
        },
        required: false
      }
    ],
    order: [['TYPE', 'DESC'], ['NAME', 'ASC']],
    limit,
    offset,
    distinct: true,
    subQuery: false // Optimize for better performance with JOINs
  });
};

Contact.searchByJobTitle = function(jobTitle, options = {}) {
  const { Op } = require('sequelize');
  const { limit = 20, offset = 0 } = options;
  
  return this.findAndCountAll({
    where: {
      JOBTITLE: { [Op.like]: `%${jobTitle}%` }
    },
    order: [['NAME', 'ASC']],
    limit,
    offset
  });
};

Contact.searchByAddress = function(address, options = {}) {
  const { Op } = require('sequelize');
  const { limit = 20, offset = 0 } = options;
  
  return this.findAndCountAll({
    where: {
      [Op.or]: [
        { ADDRESS: { [Op.like]: `%${address}%` } },
        { CITY: { [Op.like]: `%${address}%` } },
        { STATE: { [Op.like]: `%${address}%` } },
        { COUNTRY: { [Op.like]: `%${address}%` } }
      ]
    },
    order: [['NAME', 'ASC']],
    limit,
    offset
  });
};

Contact.findWithPagination = async function(options = {}) {
  const { limit = 20, offset = 0, search = '', email = '', phone = '', company = '' } = options;
  const { Op } = require('sequelize');
  const ContactFieldValue = require('./ContactFieldValue');
  
  let whereClause = {};
  let includeEmailWhere = {};
  let includePhoneWhere = {};
  
  // Build main contact search conditions
  const contactSearchConditions = [];
  
  if (search) {
    contactSearchConditions.push(
      { NAME: { [Op.like]: `%${search}%` } },
      { JOBTITLE: { [Op.like]: `%${search}%` } },
      { PARENTCONTACTNAME: { [Op.like]: `%${search}%` } },
      { ADDRESS: { [Op.like]: `%${search}%` } },
      { CITY: { [Op.like]: `%${search}%` } }
    );
  }
  
  if (company) {
    contactSearchConditions.push(
      { PARENTCONTACTNAME: { [Op.like]: `%${company}%` } }
    );
  }
  
  // Build email search conditions
  if (email) {
    includeEmailWhere.EMAIL = { [Op.like]: `%${email}%` };
  }
  
  // Build phone search conditions  
  if (phone) {
    includePhoneWhere.NUMBER = { [Op.like]: `%${phone}%` };
  }
  
  // If we have search terms, create the main where clause
  if (contactSearchConditions.length > 0) {
    whereClause[Op.or] = contactSearchConditions;
  }
  
  // Enhanced query with optimized JOINs for email and phone search
  const queryOptions = {
    where: whereClause,
    include: [
      {
        model: ContactEmail,
        as: 'emails',
        attributes: ['ID', 'EMAIL', 'CONTACTID', 'ORID', 'USERID'],
        where: {
          ORID: { [Op.col]: 'CONTACT.ORID' },
          ...includeEmailWhere
        },
        required: email ? true : false // Use INNER JOIN if searching by email
      },
      {
        model: ContactPhone,
        as: 'phones',
        attributes: ['ID', 'NUMBER', 'CONTROLNUMBER', 'TYPE', 'CONTACTID', 'ORID', 'USERID'],
        where: {
          ORID: { [Op.col]: 'CONTACT.ORID' },
          ...includePhoneWhere
        },
        required: phone ? true : false // Use INNER JOIN if searching by phone
      }
    ],
    order: [['TYPE', 'DESC'], ['NAME', 'ASC']],
    limit,
    offset,
    distinct: true,
    subQuery: false // Optimize for better performance with JOINs
  };
  
  // If searching by email or phone, we need to handle the search differently
  // to include contacts that match in their related email/phone records
  if (search && (email || phone)) {
    // Complex search across all fields including related data
    const emailSearchCondition = email ? 
      { '$emails.EMAIL$': { [Op.like]: `%${email}%` } } : null;
    const phoneSearchCondition = phone ? 
      { '$phones.NUMBER$': { [Op.like]: `%${phone}%` } } : null;
    
    const allSearchConditions = [...contactSearchConditions];
    
    if (emailSearchCondition) allSearchConditions.push(emailSearchCondition);
    if (phoneSearchCondition) allSearchConditions.push(phoneSearchCondition);
    
    queryOptions.where = {
      [Op.or]: allSearchConditions
    };
  } else if (search) {
    // General search that includes email and phone data
    queryOptions.where = {
      [Op.or]: [
        ...contactSearchConditions,
        { '$emails.EMAIL$': { [Op.like]: `%${search}%` } },
        { '$phones.NUMBER$': { [Op.like]: `%${search}%` } }
      ]
    };
  }
  
  // Get contacts with pagination
  const result = await this.findAndCountAll(queryOptions);
  
  // Get tax information for all contacts in the result
  if (result.rows && result.rows.length > 0) {
    const contactIds = result.rows.map(contact => contact.ID);
    const orid = result.rows[0].ORID; // Assuming all contacts have the same ORID
    
    // Get custom field values for tax information
    const customFields = await ContactFieldValue.findAll({
      where: {
        CONTACTID: { [Op.in]: contactIds },
        ORID: orid,
        FIELDID: [28, 29, 30] // 28: Vergi No, 29: Vergi Dairesi, 30: TC Kimlik No
      },
      attributes: ['CONTACTID', 'FIELDID', 'VALUE']
    });
    
    // Organize custom fields by contact ID
    const fieldsByContact = {};
    customFields.forEach(field => {
      if (!fieldsByContact[field.CONTACTID]) {
        fieldsByContact[field.CONTACTID] = {};
      }
      
      switch(field.FIELDID) {
        case 28:
          fieldsByContact[field.CONTACTID].VKN = field.VALUE;
          break;
        case 29:
          fieldsByContact[field.CONTACTID].TAXOFFICE = field.VALUE;
          break;
        case 30:
          fieldsByContact[field.CONTACTID].TCKN = field.VALUE;
          break;
      }
    });
    
    // Add tax information to each contact
    result.rows = result.rows.map(contact => {
      const contactData = contact.toJSON();
      const taxInfo = fieldsByContact[contact.ID] || {};
      
      return {
        ...contactData,
        TCKN: taxInfo.TCKN || null,
        VKN: taxInfo.VKN || null,
        TAXOFFICE: taxInfo.TAXOFFICE || null
      };
    });
  }
  
  return result;
};

Contact.getWithRelatedData = async function(contactId) {
  try {
    const ContactEmail = require('./ContactEmail');
    const ContactPhone = require('./ContactPhone');
    const ContactFieldValue = require('./ContactFieldValue');
    
    const contact = await this.findByPk(contactId);
    if (!contact) return null;
    
    console.log('Contact found:', contact.ID, 'ORID:', contact.ORID);
    
    // Manuel olarak e-posta ve telefon verilerini çek
    const emails = await ContactEmail.findAll({
      where: {
        CONTACTID: contactId,
        ORID: contact.ORID
      },
      attributes: ['ID', 'EMAIL', 'CONTACTID', 'ORID', 'USERID']
    });
    
    const phones = await ContactPhone.findAll({
      where: {
        CONTACTID: contactId,
        ORID: contact.ORID
      },
      attributes: ['ID', 'NUMBER', 'CONTROLNUMBER', 'TYPE', 'CONTACTID', 'ORID', 'USERID']
    });
    
    // Tüm custom field değerlerini çek
    const ContactField = require('./ContactField');
    console.log('Fetching custom fields for contactId:', contactId);
    
    // Raw query kullanarak test et
    const [customFieldsRaw] = await sequelize.query(
      'SELECT ID, CONTACTID, FIELDID, VALUE FROM CONTACTFIELDVALUE WHERE CONTACTID = ?',
      { replacements: [contactId] }
    );
    console.log('Raw query found custom fields:', customFieldsRaw.length);
    
    const customFields = customFieldsRaw;
     console.log('Found custom fields:', customFields.length);
    
    // Field bilgilerini ayrı ayrı çek
    for (let i = 0; i < customFields.length; i++) {
      const fieldInfo = await ContactField.findByPk(customFields[i].FIELDID);
      customFields[i].field = fieldInfo;
    }
    console.log('Custom fields with field info:', customFields.length);
    
    // Özel alanları organize et (eski format için backward compatibility)
    const fieldValues = {};
    customFields.forEach(field => {
      switch(field.FIELDID) {
        case 28:
          fieldValues.VKN = field.VALUE;
          break;
        case 29:
          fieldValues.TAXOFFICE = field.VALUE;
          break;
        case 30:
          fieldValues.TCKN = field.VALUE;
          break;
      }
    });
    
    console.log('Emails found:', emails ? emails.length : 0);
    console.log('Phones found:', phones ? phones.length : 0);
    console.log('Custom fields found:', customFields ? customFields.length : 0);
    
    const result = {
      contact: {
        ...contact.toJSON(),
        ...fieldValues
      },
      emails: emails || [],
      phones: phones || [],
      customFields: customFields || []
    };
    
    console.log('Returning result with emails:', result.emails.length, 'phones:', result.phones.length);
    
    return result;
  } catch (error) {
    console.error('Error in getWithRelatedData:', error);
    throw error;
  }
};

Contact.findByStatus = function(status) {
  return this.findAll({ 
    where: { STATUS: status },
    order: [['DATETIME', 'DESC']]
  });
};

Contact.getRecentContacts = function(limit = 10) {
  return this.findAll({
    order: [['DATETIME', 'DESC']],
    limit
  });
};

// Advanced search method with optimized performance
Contact.advancedSearch = function(searchOptions = {}) {
  const { 
    query = '', 
    email = '', 
    phone = '', 
    company = '', 
    limit = 20, 
    offset = 0 
  } = searchOptions;
  const { Op } = require('sequelize');
  
  // Build search conditions
  const searchConditions = [];
  
  if (query) {
    searchConditions.push(
      { NAME: { [Op.like]: `%${query}%` } },
      { JOBTITLE: { [Op.like]: `%${query}%` } },
      { PARENTCONTACTNAME: { [Op.like]: `%${query}%` } },
      { ADDRESS: { [Op.like]: `%${query}%` } },
      { CITY: { [Op.like]: `%${query}%` } },
      { '$emails.EMAIL$': { [Op.like]: `%${query}%` } },
      { '$phones.NUMBER$': { [Op.like]: `%${query}%` } }
    );
  }
  
  if (email) {
    searchConditions.push({ '$emails.EMAIL$': { [Op.like]: `%${email}%` } });
  }
  
  if (phone) {
    searchConditions.push({ '$phones.NUMBER$': { [Op.like]: `%${phone}%` } });
  }
  
  if (company) {
    searchConditions.push({ PARENTCONTACTNAME: { [Op.like]: `%${company}%` } });
  }
  
  const whereClause = searchConditions.length > 0 ? 
    { [Op.or]: searchConditions } : {};
  
  return this.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: ContactEmail,
        as: 'emails',
        attributes: ['ID', 'EMAIL', 'CONTACTID', 'ORID', 'USERID'],
        where: {
          ORID: { [Op.col]: 'CONTACT.ORID' }
        },
        required: false
      },
      {
        model: ContactPhone,
        as: 'phones',
        attributes: ['ID', 'NUMBER', 'CONTROLNUMBER', 'TYPE', 'CONTACTID', 'ORID', 'USERID'],
        where: {
          ORID: { [Op.col]: 'CONTACT.ORID' }
        },
        required: false
      }
    ],
    order: [
      ['TYPE', 'DESC'], 
      ['NAME', 'ASC']
    ],
    limit,
    offset,
    distinct: true,
    subQuery: false
  });
};

module.exports = Contact;