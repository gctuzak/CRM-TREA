const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactFieldValue = sequelize.define('CONTACTFIELDVALUE', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  FIELDID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  CONTACTID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  VALUE: {
    type: DataTypes.STRING(1000),
    allowNull: false
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
  tableName: 'CONTACTFIELDVALUE',
  timestamps: false
});

// Association tanımlaması
ContactFieldValue.associate = function(models) {
  ContactFieldValue.belongsTo(models.ContactField, {
    foreignKey: 'FIELDID',
    as: 'field'
  });
};

module.exports = ContactFieldValue;