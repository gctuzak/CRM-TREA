const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Opportunity = sequelize.define('OPPORTUNITY', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  NAME: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  NOTE: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  CONTACTID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CONTACT',
      key: 'ID'
    }
  },
  CLIENTID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  STATUSTYPEID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  OWNERUSERID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'USER',
      key: 'ID'
    }
  },
  USERID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'USER',
      key: 'ID'
    }
  },
  DATETIME: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ORID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  DATETIMEEDIT: {
    type: DataTypes.DATE,
    allowNull: false
  },
  USERIDEDIT: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'USER',
      key: 'ID'
    }
  },
  LEADID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  USDRATE: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  EURRATE: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  DISCOUNTPER: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  DISCOUNTAMN: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  SUBTOTAL: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  TOTALCOST: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  FINALTOTAL: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  CURRENCY: {
    type: DataTypes.STRING(3),
    allowNull: true
  },
  VATPER1: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  VATVALUE1: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  VATPER2: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  VATVALUE2: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  VATPER3: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  VATVALUE3: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  VATINCLUDE: {
    type: DataTypes.STRING(1),
    allowNull: true
  },
  STAMP: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'OPPORTUNITY',
  timestamps: false,
  hooks: {
    beforeUpdate: (opportunity) => {
      opportunity.STAMP = new Date();
      opportunity.DATETIMEEDIT = new Date();
    }
  }
});

// Instance methods
Opportunity.prototype.getFormattedAmount = function() {
  const amount = parseFloat(this.FINALTOTAL || 0);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: this.CURRENCY || 'TRY'
  }).format(amount);
};

Opportunity.prototype.getSubtotalAmount = function() {
  return parseFloat(this.SUBTOTAL || 0);
};

Opportunity.prototype.getTotalCostAmount = function() {
  return parseFloat(this.TOTALCOST || 0);
};

Opportunity.prototype.getFinalTotalAmount = function() {
  return parseFloat(this.FINALTOTAL || 0);
};

// Class methods
Opportunity.findByStatus = function(statusTypeId, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  return this.findAndCountAll({ 
    where: { STATUSTYPEID: statusTypeId },
    order: [['DATETIME', 'DESC']],
    limit,
    offset
  });
};

Opportunity.findByUser = function(userId, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  return this.findAndCountAll({ 
    where: { OWNERUSERID: userId },
    order: [['DATETIME', 'DESC']],
    limit,
    offset
  });
};

Opportunity.findByContact = function(contactId) {
  return this.findAll({ 
    where: { CONTACTID: contactId },
    order: [['DATETIME', 'DESC']]
  });
};

Opportunity.findWithPagination = function(options = {}) {
  const { limit = 20, offset = 0, search = '', status = null } = options;
  const { Op } = require('sequelize');
  
  let whereClause = {};
  
  if (search) {
    whereClause.NAME = { [Op.like]: `%${search}%` };
  }
  
  if (status) {
    whereClause.STATUSTYPEID = status;
  }
  
  return this.findAndCountAll({
    where: whereClause,
    order: [['DATETIME', 'DESC']],
    limit,
    offset
  });
};

Opportunity.getWithContactInfo = async function(opportunityId) {
  const opportunity = await this.findByPk(opportunityId);
  if (!opportunity) return null;
  
  // İlgili contact bilgilerini getir (Contact model'i import edildikten sonra)
  // const Contact = require('./Contact');
  // const contact = await Contact.findByPk(opportunity.CONTACTID);
  
  return {
    opportunity,
    // contact
  };
};

Opportunity.getRecentOpportunities = function(limit = 10) {
  return this.findAll({
    order: [['DATETIME', 'DESC']],
    limit
  });
};

Opportunity.getSalesPipeline = async function(userId = null) {
  const { Op } = require('sequelize');
  
  try {
    const whereClause = userId ? { USERID: userId } : {};
    
    // Get opportunities grouped by status
    const pipeline = await this.findAll({
      where: whereClause,
      attributes: [
        'STATUSTYPEID',
        [sequelize.fn('COUNT', sequelize.col('ID')), 'count'],
        [sequelize.fn('SUM', sequelize.col('FINALTOTAL')), 'totalValue']
      ],
      group: ['STATUSTYPEID'],
      raw: true
    });
    
    // Map status IDs to meaningful names based on actual data
    const statusMap = {
      0: 'New',
      1: 'Prospecting',
      2: 'Qualification', 
      3: 'Proposal',
      7: 'In Progress',
      10: 'Negotiation',
      11: 'Closed Won',
      12: 'Closed Lost'
    };
    
    return pipeline.map(item => ({
      status: statusMap[item.STATUSTYPEID] || `Status ${item.STATUSTYPEID}`,
      statusId: item.STATUSTYPEID,
      count: parseInt(item.count),
      totalValue: parseFloat(item.totalValue || 0)
    }));
  } catch (error) {
    console.error('getSalesPipeline error:', error);
    return [];
  }
};

module.exports = Opportunity;