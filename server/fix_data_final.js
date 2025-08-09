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
    charset: 'utf8mb4'
  },
  
  logging: false // Sadece önemli logları göster
});

// Türkçe karakter düzeltme fonksiyonu - son versiyon
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
    .replace(/\?\?\?\?/g, 'ÖZEL')
    .replace(/\?\?\?/g, 'ÇAĞ')
    
    // Yanlış düzeltilmiş karakterleri düzelt
    .replace(/İ/g, 'İ')
    .replace(/ı/g, 'ı')
    .replace(/ş/g, 'ş')
    .replace(/ğ/g, 'ğ')
    .replace(/ü/g, 'ü')
    .replace(/ö/g, 'ö')
    .replace(/ç/g, 'ç');
    
  return fixed;
}

// Özel kelime düzeltme fonksiyonu
function fixSpecificWords(text) {
  if (!text) return text;
  
  // Özel kelime düzeltmeleri
  let fixed = text
    .replace(/SİTE YİNETİCİLÖZELİ/g, 'SİTE YÖNETİCİLİĞİ')
    .replace(/SİTE YİNETİCİL/g, 'SİTE YÖNETİCİL')
    .replace(/YİNETİM/g, 'YÖNETİM')
    .replace(/İNİAAT/g, 'İNŞAAT')
    .replace(/İNİ\./g, 'İNŞ.')
    .replace(/MİH\./g, 'MÜH.')
    .replace(/TİRK/g, 'TÜRK')
    .replace(/Tİrk/g, 'Türk')
    .replace(/GAYRİMENKİL/g, 'GAYRİMENKUL')
    .replace(/MİTEAHHİT/g, 'MÜTEAHHİT')
    .replace(/MİHENDİS/g, 'MÜHENDİS')
    .replace(/MİHENDİSLİK/g, 'MÜHENDİSLİK')
    .replace(/MİDİR/g, 'MÜDÜR')
    .replace(/MİDİRL/g, 'MÜDÜRL')
    .replace(/İİRKET/g, 'ŞİRKET')
    .replace(/İİRK/g, 'ŞİRK')
    .replace(/İRK/g, 'ŞRK')
    .replace(/İTİ\./g, 'ŞTİ.')
    .replace(/LTD\.İTİ/g, 'LTD.ŞTİ')
    .replace(/A\.İ\./g, 'A.Ş.')
    .replace(/İİ\./g, 'Şİ.')
    .replace(/TÖZEL/g, 'TÜZEL')
    .replace(/İletiİim/g, 'İletişim')
    .replace(/İnİ/g, 'İnş')
    .replace(/İth/g, 'İth')
    .replace(/İhr/g, 'İhr')
    .replace(/İLETÖZELİM/g, 'İLETİŞİM')
    .replace(/GELÖZELTİRME/g, 'GELİŞTİRME');
    
  // Özel düzeltmeler
  fixed = fixed
    .replace(/3K-İLETÖZELİM/g, '3K-İLETİŞİM')
    .replace(/3S KALE GAYRİMENKUL GELÖZELTİRME/g, '3S KALE GAYRİMENKUL GELİŞTİRME');
    
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
      // İlk düzeltme
      let fixedName = fixTurkishChars(contact.NAME);
      let fixedAddress = fixTurkishChars(contact.ADDRESS);
      let fixedCity = fixTurkishChars(contact.CITY);
      let fixedState = fixTurkishChars(contact.STATE);
      let fixedCountry = fixTurkishChars(contact.COUNTRY);
      let fixedNote = fixTurkishChars(contact.NOTE);
      
      // Özel kelime düzeltmeleri
      fixedName = fixSpecificWords(fixedName);
      fixedAddress = fixSpecificWords(fixedAddress);
      fixedCity = fixSpecificWords(fixedCity);
      fixedState = fixSpecificWords(fixedState);
      fixedCountry = fixSpecificWords(fixedCountry);
      fixedNote = fixSpecificWords(fixedNote);
      
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
      "SELECT NAME FROM CONTACT LIMIT 20"
    );
    console.log('📄 Sample data after fixing:');
    sampleData.forEach(item => console.log(` - ${item.NAME}`));
    
    // Diğer tabloları da kontrol et
    console.log('\n🔍 Checking other tables for Turkish characters...');
    
    // OPPORTUNITY tablosu
    const [opportunities] = await sequelize.query(
      "SELECT ID, NAME FROM OPPORTUNITY LIMIT 5"
    );
    if (opportunities.length > 0) {
      console.log('\n📄 Sample OPPORTUNITY data:');
      opportunities.forEach(item => console.log(` - ${item.NAME}`));
    }
    
    // TASK tablosunun yapısını kontrol et
    try {
      const [taskColumns] = await sequelize.query(
        "SHOW COLUMNS FROM TASK"
      );
      console.log('\n📋 TASK table columns:');
      taskColumns.forEach(col => console.log(` - ${col.Field}`));
      
      // Sütun adlarını bulduktan sonra örnek veri göster
      if (taskColumns.length > 0) {
        const [tasks] = await sequelize.query(
          `SELECT ID, ${taskColumns[1].Field} FROM TASK LIMIT 5`
        );
        if (tasks.length > 0) {
          console.log('\n📄 Sample TASK data:');
          tasks.forEach(item => console.log(` - ${item[taskColumns[1].Field]}`));
        }
      }
    } catch (error) {
      console.log('❌ Could not query TASK table:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixData();