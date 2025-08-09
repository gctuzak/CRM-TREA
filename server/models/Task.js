const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('TASK', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  USERID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  DATETIME: {
    type: DataTypes.DATE,
    allowNull: true
  },
  DATETIMEDUE: {
    type: DataTypes.DATE,
    allowNull: true
  },
  NOTE: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  STATUS: {
    type: DataTypes.ENUM('In progress', 'New', 'Completed'),
    allowNull: false,
    defaultValue: 'New'
  },
  TYPEID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  CONTACTID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  OPPORTUNITYID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  LEADID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  JOBID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ORID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  DATETIMEEDIT: {
    type: DataTypes.DATE,
    allowNull: true
  },
  USERIDEDIT: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  PARENTTASKID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  RECUR: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  RECURDUEDATE: {
    type: DataTypes.DATE,
    allowNull: true
  },
  GOOGLETASKID: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  STAMP: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'TASK',
  timestamps: false,
  hooks: {
    beforeUpdate: (task) => {
      task.STAMP = new Date();
      task.DATETIMEEDIT = new Date();
    }
  }
});

// Instance methods
Task.prototype.isOverdue = function() {
  if (!this.DATETIMEDUE || this.STATUS === 'Completed') return false;
  return new Date() > new Date(this.DATETIMEDUE);
};

Task.prototype.isDueToday = function() {
  if (!this.DATETIMEDUE) return false;
  const today = new Date();
  const dueDate = new Date(this.DATETIMEDUE);
  return today.toDateString() === dueDate.toDateString();
};

Task.prototype.getDaysUntilDue = function() {
  if (!this.DATETIMEDUE) return null;
  const today = new Date();
  const dueDate = new Date(this.DATETIMEDUE);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Task.prototype.markCompleted = function() {
  this.STATUS = 'Completed';
  this.DATETIMEEDIT = new Date();
  return this.save();
};

Task.prototype.isRecurring = function() {
  return this.RECUR && this.RECUR !== '';
};

// Class methods
Task.findByUser = function(userId, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  return this.findAndCountAll({ 
    where: { USERID: userId },
    order: [['DATETIMEDUE', 'ASC'], ['DATETIME', 'DESC']],
    limit,
    offset
  });
};

Task.findByStatus = function(status, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  return this.findAndCountAll({ 
    where: { STATUS: status },
    order: [['DATETIMEDUE', 'ASC']],
    limit,
    offset
  });
};

Task.findOverdue = function(userId = null, options = {}) {
  const { Op } = require('sequelize');
  const { limit = 20, offset = 0 } = options;
  
  const whereClause = {
    DATETIMEDUE: { [Op.lt]: new Date() },
    STATUS: { [Op.not]: 'Completed' }
  };
  
  if (userId) {
    whereClause.USERID = userId;
  }
  
  return this.findAndCountAll({
    where: whereClause,
    order: [['DATETIMEDUE', 'ASC']],
    limit,
    offset
  });
};

Task.findDueToday = function(userId = null, options = {}) {
  const { Op } = require('sequelize');
  const { limit = 20, offset = 0 } = options;
  
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const whereClause = {
    DATETIMEDUE: {
      [Op.gte]: startOfDay,
      [Op.lt]: endOfDay
    },
    STATUS: { [Op.not]: 'Completed' }
  };
  
  if (userId) {
    whereClause.USERID = userId;
  }
  
  return this.findAndCountAll({
    where: whereClause,
    order: [['DATETIMEDUE', 'ASC']],
    limit,
    offset
  });
};

Task.findWithPagination = function(options = {}) {
  const { limit = 20, offset = 0, search = '', status = null, userId = null } = options;
  const { Op } = require('sequelize');
  
  let whereClause = {};
  
  if (search) {
    whereClause.NOTE = { [Op.like]: `%${search}%` };
  }
  
  if (status) {
    whereClause.STATUS = status;
  }
  
  if (userId) {
    whereClause.USERID = userId;
  }
  
  return this.findAndCountAll({
    where: whereClause,
    order: [['DATETIME', 'DESC']],
    limit,
    offset
  });
};

Task.findByContact = function(contactId) {
  return this.findAll({ 
    where: { CONTACTID: contactId },
    order: [['DATETIME', 'DESC']]
  });
};

Task.findByOpportunity = function(opportunityId) {
  return this.findAll({ 
    where: { OPPORTUNITYID: opportunityId },
    order: [['DATETIME', 'DESC']]
  });
};

Task.findByParent = function(parentTaskId) {
  return this.findAll({ 
    where: { PARENTTASKID: parentTaskId },
    order: [['DATETIME', 'ASC']]
  });
};

module.exports = Task;