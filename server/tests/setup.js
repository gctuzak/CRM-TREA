const { sequelize } = require('../config/database');

// Test database setup
const setupTestDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Test database connection established');
    
    // Sync database models for testing
    await sequelize.sync({ force: true });
    console.log('✅ Test database models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    return false;
  }
};

// Cleanup test database
const cleanupTestDatabase = async () => {
  try {
    await sequelize.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
  }
};

// Create test data
const createTestData = async () => {
  const { User, Contact, Opportunity, Task } = require('../models');
  
  try {
    // Create test user
    const testUser = await User.create({
      NAME: 'Test User',
      EMAIL: 'test@example.com',
      PASSWORD: 'hashedpassword',
      ROLE: 'admin',
      ORID: 1,
      DATETIME: new Date(),
      DATETIMEEDIT: new Date(),
      USERIDEDIT: 1
    });

    // Create test contact
    const testContact = await Contact.create({
      NAME: 'Test Contact',
      JOBTITLE: 'Test Manager',
      ADDRESS: 'Test Address',
      CITY: 'Test City',
      COUNTRY: 'Turkey',
      NOTE: 'Test contact for integration testing',
      ORID: 1,
      USERID: testUser.ID,
      DATETIME: new Date(),
      DATETIMEEDIT: new Date(),
      USERIDEDIT: testUser.ID,
      POSITION: '',
      COORDINATE: ''
    });

    // Create test opportunity
    const testOpportunity = await Opportunity.create({
      NAME: 'Test Opportunity',
      NOTE: 'Test opportunity for integration testing',
      CONTACTID: testContact.ID,
      STATUSTYPEID: 1,
      USERID: testUser.ID,
      OWNERUSERID: testUser.ID,
      DATETIME: new Date(),
      ORID: 1,
      DATETIMEEDIT: new Date(),
      USERIDEDIT: testUser.ID,
      LEADID: 0,
      FINALTOTAL: '10000',
      CURRENCY: 'TRY'
    });

    // Create test task
    const testTask = await Task.create({
      USERID: testUser.ID,
      DATETIME: new Date(),
      DATETIMEDUE: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      NOTE: 'Test task for integration testing',
      STATUS: 'New',
      TYPEID: 1,
      CONTACTID: testContact.ID,
      OPPORTUNITYID: testOpportunity.ID,
      ORID: 1,
      DATETIMEEDIT: new Date(),
      USERIDEDIT: testUser.ID
    });

    return {
      user: testUser,
      contact: testContact,
      opportunity: testOpportunity,
      task: testTask
    };
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
    throw error;
  }
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  createTestData
};