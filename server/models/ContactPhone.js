const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactPhone = sequelize.define('CONTACTPHONE', {
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
  NUMBER: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  CONTROLNUMBER: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  TYPE: {
    type: DataTypes.STRING(20),
    allowNull: true
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
  tableName: 'CONTACTPHONE',
  timestamps: false
});

module.exports = ContactPhone;