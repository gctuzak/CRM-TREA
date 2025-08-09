const { Sequelize } = require('sequelize');

// Database configuration with utf8mb4
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'mydatabase',
  username: 'migration_user',
  password: 'migration_pass',
  
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  logging: console.log
});

// Türkçe karakter düzeltme fonksiyonu
function fixTurkishChars(text) {
  if (!text) return text;
  
  // Bozuk Türkçe karakterleri düzelt
  let fixed = text
    // Önce genel düzeltmeler
    .replace(/\u0000/g, '') // Null karakterleri temizle
    .replace(/Şİ/g, 'İ') // Yanlış düzeltilmiş İ karakteri
    .replace(/ŞİSTANBUL/g, 'İSTANBUL')
    .replace(/TŞİRKŞİYE/g, 'TÜRKİYE')
    .replace(/TŞİrkiye/g, 'Türkiye')
    .replace(/MŞİdŞİrlŞİk/g, 'Müdürlük')
    .replace(/KadŞİkŞİy/g, 'Kadıköy')
    .replace(/AtaŞİehir/g, 'Ataşehir')
    .replace(/BulvarŞİ/g, 'Bulvarı')
    .replace(/ÇAĞ/g, 'ÇAĞ')
    .replace(/ÖZEL/g, 'ÖZEL')
    .replace(/ŞİTŞİ/g, 'ŞTİ')
    .replace(/TŞİC/g, 'TİC')
    .replace(/DŞİZAYN/g, 'DİZAYN')
    .replace(/MŞİMARLIK/g, 'MİMARLIK')
    .replace(/MimarlŞİk/g, 'Mimarlık');
    
  return fixed;
}

async function fixData() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // CONTACT tablosundaki verileri düzelt
    console.log('🔧 Fixing CONTACT table data...');
    
    // Önce tüm kayıtları al
    const [contacts] = await sequelize.query(
      "SELECT ID, NAME, ADDRESS, CITY, STATE, COUNTRY, NOTE FROM CONTACT"
    );
    
    console.log(`📊 Found ${contacts.length} contacts to fix`);
    
    // Her kayıt için Türkçe karakterleri düzelt
    let fixedCount = 0;
    for (const contact of contacts) {
      const fixedName = fixTurkishChars(contact.NAME);
      const fixedAddress = fixTurkishChars(contact.ADDRESS);
      const fixedCity = fixTurkishChars(contact.CITY);
      const fixedState = fixTurkishChars(contact.STATE);
      const fixedCountry = fixTurkishChars(contact.COUNTRY);
      const fixedNote = fixTurkishChars(contact.NOTE);
      
      // Eğer herhangi bir değişiklik varsa güncelle
      if (fixedName !== contact.NAME || 
          fixedAddress !== contact.ADDRESS || 
          fixedCity !== contact.CITY || 
          fixedState !== contact.STATE || 
          fixedCountry !== contact.COUNTRY || 
          fixedNote !== contact.NOTE) {
        
        await sequelize.query(
          `UPDATE CONTACT SET 
           NAME = ?, 
           ADDRESS = ?, 
           CITY = ?, 
           STATE = ?, 
           COUNTRY = ?, 
           NOTE = ? 
           WHERE ID = ?`,
          {
            replacements: [
              fixedName, 
              fixedAddress, 
              fixedCity, 
              fixedState, 
              fixedCountry, 
              fixedNote, 
              contact.ID
            ]
          }
        );
        
        fixedCount++;
        if (fixedCount % 100 === 0) {
          console.log(`✅ Fixed ${fixedCount} contacts so far`);
        }
      }
    }
    
    console.log(`🎉 Fixed ${fixedCount} contacts in total`);
    
    // Test sample data after fixing
    const [sampleData] = await sequelize.query(
      "SELECT NAME FROM CONTACT LIMIT 5"
    );
    console.log('📄 Sample data after fixing:', sampleData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixData();