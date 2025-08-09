const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactEmail = sequelize.define('CONTACTEMAIL', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  CONTACTID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CONTACT',
      key: 'ID'
    }
  },
  EMAIL: {
    type: DataTypes.STRING(70),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  ORID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  USERID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  DATETIMEEDIT: {
    type: DataTypes.DATE,
    allowNull: true
  },
  STAMP: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CONTACTEMAIL',
  timestamps: false
});

module.exports = ContactEmail;