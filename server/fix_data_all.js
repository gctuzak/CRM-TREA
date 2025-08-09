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
  if (typeof text !== 'string') return text;
  
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
    .replace(/ç/g, 'ç')
    
    // Özel karakter düzeltmeleri
    .replace(/İ/g, 'ş')
    .replace(/İ/g, 'ğ')
    .replace(/İ/g, 'ü')
    .replace(/İ/g, 'ö')
    .replace(/İ/g, 'ç')
    .replace(/İ/g, 'ı')
    .replace(/İ/g, 'İ');
    
  return fixed;
}

// Özel kelime düzeltme fonksiyonu
function fixSpecificWords(text) {
  if (!text) return text;
  if (typeof text !== 'string') return text;
  
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
    .replace(/GELÖZELTİRME/g, 'GELİŞTİRME')
    .replace(/Yenidoİan/g, 'Yenidoğan')
    .replace(/Aslanaİzİ/g, 'Aslanağzı');
    
  // Özel düzeltmeler
  fixed = fixed
    .replace(/3K-İLETÖZELİM/g, '3K-İLETİŞİM')
    .replace(/3S KALE GAYRİMENKUL GELÖZELTİRME/g, '3S KALE GAYRİMENKUL GELİŞTİRME');
    
  return fixed;
}

async function fixAllTables() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Tüm tabloları listele
    const [tables] = await sequelize.query(
      "SHOW TABLES"
    );
    
    console.log(`📊 Found ${tables.length} tables in database`);
    
    // İşlenecek tabloları belirle (LEAD tablosunu hariç tut çünkü MySQL'de ayrılmış kelime)
    const tablesToProcess = [];
    
    for (const tableObj of tables) {
      const tableName = tableObj[Object.keys(tableObj)[0]];
      // LEAD tablosunu atla
      if (tableName.toUpperCase() === 'LEAD') {
        console.log(`⚠️ Skipping reserved keyword table: ${tableName}`);
        continue;
      }
      tablesToProcess.push(tableName);
    }
    
    // Her tablo için işlem yap
    for (const tableName of tablesToProcess) {
      console.log(`\n🔍 Processing table: ${tableName}`);
      
      try {
        // Tablonun sütunlarını al
        const [columns] = await sequelize.query(
          `SHOW COLUMNS FROM \`${tableName}\``
        );
        
        // Metin içeren sütunları bul (VARCHAR, TEXT, CHAR, etc.)
        const textColumns = columns.filter(col => 
          col.Type.includes('varchar') || 
          col.Type.includes('text') || 
          col.Type.includes('char')
        );
        
        if (textColumns.length === 0) {
          console.log(`  ℹ️ No text columns found in ${tableName}`);
          continue;
        }
        
        console.log(`  📝 Found ${textColumns.length} text columns in ${tableName}`);
        
        // Tüm kayıtları al
        const [records] = await sequelize.query(
          `SELECT * FROM \`${tableName}\` LIMIT 1000`
        );
        
        console.log(`  📊 Processing ${records.length} records in ${tableName}`);
        
        // Her kayıt için metin sütunlarını düzelt
        let fixedCount = 0;
        
        for (const record of records) {
          const updates = [];
          const values = [];
          
          // Her metin sütunu için düzeltme yap
          for (const column of textColumns) {
            const columnName = column.Field;
            const originalValue = record[columnName];
            
            // Eğer değer varsa düzelt
            if (originalValue && typeof originalValue === 'string') {
              // İlk düzeltme
              let fixedValue = fixTurkishChars(originalValue);
              // Özel kelime düzeltmeleri
              fixedValue = fixSpecificWords(fixedValue);
              
              // Eğer değişiklik varsa güncelleme listesine ekle
              if (fixedValue !== originalValue) {
                updates.push(`\`${columnName}\` = ?`);
                values.push(fixedValue);
              }
            }
          }
          
          // Eğer güncelleme yapılacaksa
          if (updates.length > 0) {
            // ID sütununu bul
            const idColumn = columns.find(col => col.Key === 'PRI');
            if (!idColumn) {
              console.log(`  ⚠️ No primary key found for table ${tableName}, skipping updates`);
              break;
            }
            
            const idColumnName = idColumn.Field;
            const idValue = record[idColumnName];
            
            // Güncelleme sorgusu oluştur
            const updateQuery = `UPDATE \`${tableName}\` SET ${updates.join(', ')} WHERE \`${idColumnName}\` = ?`;
            values.push(idValue);
            
            // Güncelleme yap
            await sequelize.query(updateQuery, {
              replacements: values
            });
            
            fixedCount++;
          }
        }
        
        console.log(`  ✅ Fixed ${fixedCount} records in ${tableName}`);
      } catch (error) {
        console.error(`  ❌ Error processing table ${tableName}:`, error.message);
      }
    }
    
    console.log('\n🎉 All tables processed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixAllTables();