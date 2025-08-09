const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('USER', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  NAME: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  EMAIL: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },

  PASSWORD: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  KEYP: {
    type: DataTypes.STRING(130),
    allowNull: true
  },
  PERMISSION: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  CALENDARFILTER: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ORGANIZATION: {
    type: DataTypes.STRING(70),
    allowNull: true
  },
  ORID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  CONTACTID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  STATUS: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: true,
    defaultValue: 'active'
  },
  ROLE: {
    type: DataTypes.ENUM('admin', 'user', 'manager'),
    allowNull: true,
    defaultValue: 'user'
  },
  PHONE: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  DEPARTMENT_ID: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  DATETIMEDEL: {
    type: DataTypes.DATE,
    allowNull: true
  },
  STAMP: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  LAST_LOGIN: {
    type: DataTypes.DATE,
    allowNull: true
  },
  CREATED_DATE: {
    type: DataTypes.DATE,
    allowNull: true
  },
  UPDATED_DATE: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'USER',
  timestamps: false
});

// Instance methods
User.prototype.checkPassword = async function(password) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, this.PASSWORD);
};

User.prototype.getFullName = function() {
  return this.NAME;
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { EMAIL: email } });
};

User.findActive = function() {
  return this.findAll({ 
    where: { STATUS: 'active' },
    order: [['NAME', 'ASC']]
  });
};

module.exports = User;