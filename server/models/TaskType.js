const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskType = sequelize.define('TASKTYPE', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  NAME: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ORID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  STAMP: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'TASKTYPE',
  timestamps: false
});

module.exports = TaskType;