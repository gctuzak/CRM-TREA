const { Contact } = require('./models');

async function testContactFields() {
  try {
    console.log('Testing contact fields...');
    
    // Test basic contact fetch
    const contact = await Contact.findByPk(1);
    console.log('Basic contact:', contact ? contact.ID : 'Not found');
    
    // Test getWithRelatedData
    const result = await Contact.getWithRelatedData(1);
    console.log('Result:', result ? 'Success' : 'Failed');
    
    if (result) {
      console.log('Contact ID:', result.contact.ID);
      console.log('Emails count:', result.emails.length);
      console.log('Phones count:', result.phones.length);
      console.log('TCKN:', result.contact.TCKN);
      console.log('VKN:', result.contact.VKN);
      console.log('TAXOFFICE:', result.contact.TAXOFFICE);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testContactFields();