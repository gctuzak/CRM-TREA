const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactField = sequelize.define('CONTACTFIELD', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  NAME: {
    type: DataTypes.STRING(40),
    allowNull: false
  },
  UNIT: {
    type: DataTypes.STRING(40),
    allowNull: false
  },
  TYPE: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  ORID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  RANK: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  MULTI: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  MANDA: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  SORT: {
    type: DataTypes.TINYINT,
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

// Association tanımlaması
ContactField.associate = function(models) {
  ContactField.hasMany(models.ContactFieldValue, {
    foreignKey: 'FIELDID',
    as: 'values'
  });
};

module.exports = ContactField;