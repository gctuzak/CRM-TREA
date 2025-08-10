const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactField = sequelize.define('CONTACTFIELD', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  NAME: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  TYPE: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  CATEGORY: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  ORID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  ORDERID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  REQUIRED: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  READONLY: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  HIDDEN: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  STAMP: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CONTACTFIELD',
  timestamps: false
});

module.exports = ContactField;