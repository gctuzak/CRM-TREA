const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'mydatabase',
  username: process.env.DB_USER || 'crmuser',
  password: process.env.DB_PASSWORD || 'crmpassword',
  
  // Connection pool configuration
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // Logging configuration
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Performance optimizations
  benchmark: process.env.NODE_ENV === 'development',
  
  // MySQL specific options
  dialectOptions: {
    charset: 'utf8mb4'
  },
  
  // Define options for all models
  define: {
    timestamps: false, // Most existing tables don't have timestamps
    freezeTableName: true, // Use table name as is
    underscored: false // Use camelCase for attributes
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Close database connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  closeConnection
};