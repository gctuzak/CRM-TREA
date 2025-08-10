const { Contact } = require('./models');

async function debugContact() {
  try {
    // Get raw contact data to see all fields
    const contact = await Contact.findByPk(1, { raw: true });
    console.log('Raw contact data:');
    console.log(JSON.stringify(contact, null, 2));
    
    // Get all field names
    const fieldNames = Object.keys(contact || {});
    console.log('\nAll field names:');
    fieldNames.forEach(field => console.log(`- ${field}`));
    
    // Look for tax/identity related fields
    const taxFields = fieldNames.filter(field => 
      field.toLowerCase().includes('tax') ||
      field.toLowerCase().includes('vergi') ||
      field.toLowerCase().includes('tc') ||
      field.toLowerCase().includes('kimlik') ||
      field.toLowerCase().includes('identity') ||
      field.toLowerCase().includes('vkn') ||
      field.toLowerCase().includes('tckn') ||
      field.toLowerCase().includes('number') ||
      field.toLowerCase().includes('no')
    );
    
    console.log('\nPotential tax/identity fields:');
    taxFields.forEach(field => console.log(`- ${field}: ${contact[field]}`));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugContact();