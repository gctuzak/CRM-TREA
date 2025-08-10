const { sequelize } = require('./config/database');

async function checkContactStructure() {
  try {
    // Get table structure
    const [results] = await sequelize.query("DESCRIBE CONTACT");
    console.log('CONTACT table structure:');
    console.table(results);
    
    // Check if there are any fields related to tax number or ID number
    const taxFields = results.filter(field => 
      field.Field.toLowerCase().includes('tax') ||
      field.Field.toLowerCase().includes('vergi') ||
      field.Field.toLowerCase().includes('tc') ||
      field.Field.toLowerCase().includes('kimlik') ||
      field.Field.toLowerCase().includes('identity') ||
      field.Field.toLowerCase().includes('vkn') ||
      field.Field.toLowerCase().includes('tckn')
    );
    
    console.log('\nFields related to tax/identity numbers:');
    console.table(taxFields);
    
    // Get a sample contact to see all fields
    const [sampleContact] = await sequelize.query("SELECT * FROM CONTACT LIMIT 1");
    console.log('\nSample contact data:');
    console.log(JSON.stringify(sampleContact[0], null, 2));
    
  } catch (error) {
    console.error('Error checking contact structure:', error);
  } finally {
    await sequelize.close();
  }
}

checkContactStructure();