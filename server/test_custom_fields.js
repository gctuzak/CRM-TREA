const { ContactFieldValue } = require('./models');

async function testCustomFields() {
  try {
    console.log('Testing custom field operations...');
    
    // Test upsert operation
    const result = await ContactFieldValue.upsert({
      FIELDID: 30, // TC Kimlik No
      CONTACTID: 1,
      VALUE: '12345678901',
      ORID: 10776,
      USERID: 1,
      DATETIMEEDIT: new Date()
    });
    
    console.log('Upsert result:', result ? 'Success' : 'Failed');
    
    // Test find operation
    const customFields = await ContactFieldValue.findAll({
      where: {
        CONTACTID: 1,
        ORID: 10776,
        FIELDID: [28, 29, 30]
      },
      attributes: ['FIELDID', 'VALUE']
    });
    
    console.log('Custom fields found:', customFields.length);
    customFields.forEach(field => {
      console.log(`Field ${field.FIELDID}: ${field.VALUE}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCustomFields();