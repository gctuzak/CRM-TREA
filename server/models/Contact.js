const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
// Ensure related models are available for includes used below
const ContactEmail = require('./ContactEmail');
const ContactPhone = require('./ContactPhone');

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
        { PARENTCONTACTNAME: { [Op.like]: `%${searchTerm}%` } }
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
    order: [['NAME', 'ASC']],
    limit,
    offset,
    distinct: true
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

Contact.findWithPagination = function(options = {}) {
  const { limit = 20, offset = 0, search = '' } = options;
  const { Op } = require('sequelize');
  
  let whereClause = {};
  if (search) {
    whereClause = {
      [Op.or]: [
        { NAME: { [Op.like]: `%${search}%` } },
        { JOBTITLE: { [Op.like]: `%${search}%` } },
        { PARENTCONTACTNAME: { [Op.like]: `%${search}%` } },
        { ADDRESS: { [Op.like]: `%${search}%` } },
        { CITY: { [Op.like]: `%${search}%` } }
      ]
    };
  }
  
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
    order: [['NAME', 'ASC']],
    limit,
    offset,
    distinct: true
  });
};

Contact.getWithRelatedData = async function(contactId) {
  try {
    const ContactEmail = require('./ContactEmail');
    const ContactPhone = require('./ContactPhone');
    
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
    
    console.log('Emails found:', emails ? emails.length : 0);
    console.log('Phones found:', phones ? phones.length : 0);
    
    const result = {
      contact,
      emails: emails || [],
      phones: phones || []
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

module.exports = Contact;