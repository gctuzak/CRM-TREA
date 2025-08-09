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
    // Null karakterleri temizle
    .replace(/\u0000/g, '')
    
    // Soru işaretlerini düzelt
    .replace(/\?\?\?\? GYO/g, 'ÖZEL GYO')
    .replace(/\?\?\? YAPIM/g, 'ÇAĞ YAPIM')
    .replace(/\?\?\?\?\?DEM/g, 'ÇİĞDEM')
    .replace(/\?\?\?gen/g, 'Üçgen')
    .replace(/\?\?\?GEN/g, 'ÜÇGEN')
    .replace(/\?\?\?kr\?\?/g, 'Şükrü')
    
    // Yanlış düzeltilmiş karakterleri düzelt
    .replace(/İ/g, 'İ')
    .replace(/ı/g, 'ı')
    .replace(/ş/g, 'ş')
    .replace(/ğ/g, 'ğ')
    .replace(/ü/g, 'ü')
    .replace(/ö/g, 'ö')
    .replace(/ç/g, 'ç')
    
    // Yanlış düzeltilmiş kelimeleri düzelt
    .replace(/İSTANBUL/g, 'İSTANBUL')
    .replace(/TİRKİYE/g, 'TÜRKİYE')
    .replace(/Tİrkiye/g, 'Türkiye')
    .replace(/Mİdİrlİk/g, 'Müdürlük')
    .replace(/Kadİkİy/g, 'Kadıköy')
    .replace(/Ataİehir/g, 'Ataşehir')
    .replace(/Bulvarİ/g, 'Bulvarı')
    .replace(/İTİ/g, 'ŞTİ')
    .replace(/TİC/g, 'TİC')
    .replace(/DİZAYN/g, 'DİZAYN')
    .replace(/MİMARLIK/g, 'MİMARLIK')
    .replace(/Mimarlİk/g, 'Mimarlık')
    .replace(/İNİ/g, 'İNŞ')
    .replace(/Mİh/g, 'Müh')
    .replace(/Tİc/g, 'Tic')
    .replace(/İt/g, 'Şt')
    .replace(/İti/g, 'Şti')
    .replace(/İTİ/g, 'ŞTİ')
    .replace(/Gİlsen/g, 'Gülsen')
    .replace(/Yİcel/g, 'Yücel')
    .replace(/Mİh/g, 'Müh')
    .replace(/Tİc/g, 'Tic')
    .replace(/İt/g, 'Şt')
    .replace(/İti/g, 'Şti')
    .replace(/İTİ/g, 'ŞTİ')
    .replace(/Gİlsen/g, 'Gülsen')
    .replace(/Yİcel/g, 'Yücel')
    .replace(/Akyİldİz/g, 'Akyıldız')
    .replace(/Tİrusel/g, 'Türusel')
    .replace(/Yapİ/g, 'Yapı')
    .replace(/Merdivenkİy/g, 'Merdivenköy');
    
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
      "SELECT NAME FROM CONTACT LIMIT 10"
    );
    console.log('📄 Sample data after fixing:', sampleData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixData();