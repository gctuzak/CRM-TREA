const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTaskTypes() {
  let connection;
  
  try {
    console.log('🎯 TASK TYPEID verilerini düzeltiyorum...');
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu');
    
    // Charset ayarla
    await connection.execute('SET NAMES utf8mb4');
    await connection.execute('SET CHARACTER SET utf8mb4');
    
    // Foreign key kontrollerini geçici olarak kapat
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // TYPEID problemlerini kontrol et
    const [nullTypes] = await connection.execute('SELECT COUNT(*) as count FROM TASK WHERE TYPEID IS NULL');
    const [zeroTypes] = await connection.execute('SELECT COUNT(*) as count FROM TASK WHERE TYPEID = 0');
    
    console.log(`📊 TYPEID NULL olan görevler: ${nullTypes[0].count}`);
    console.log(`📊 TYPEID 0 olan görevler: ${zeroTypes[0].count}`);
    
    // TYPEID=0 için TASKTYPE ekle
    try {
      await connection.execute(`
        INSERT INTO TASKTYPE (ID, NAME, ORID) 
        VALUES (0, 'Genel Görev', 10776)
      `);
      console.log('✅ TYPEID=0 için "Genel Görev" task type eklendi');
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        console.warn(`⚠️ TASKTYPE eklenirken hata: ${error.message}`);
      }
    }
    
    // TYPEID NULL olanları 0 yap (Genel görev)
    if (nullTypes[0].count > 0) {
      await connection.execute('UPDATE TASK SET TYPEID = 0 WHERE TYPEID IS NULL');
      console.log(`✅ ${nullTypes[0].count} görevin TYPEID'si NULL'dan 0'a güncellendi`);
    }
    
    // Tarih verilerini kontrol et
    const [withDates] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE DATETIME IS NOT NULL OR DATETIMEDUE IS NOT NULL
    `);
    
    const [withoutDates] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE DATETIME IS NULL AND DATETIMEDUE IS NULL
    `);
    
    console.log(`📊 Tarih bilgisi olan görevler: ${withDates[0].count}`);
    console.log(`📊 Tarih bilgisi olmayan görevler: ${withoutDates[0].count}`);
    
    // TASKTYPE dağılımını göster
    const [typeStats] = await connection.execute(`
      SELECT t.TYPEID, tt.NAME, COUNT(*) as count 
      FROM TASK t 
      LEFT JOIN TASKTYPE tt ON t.TYPEID = tt.ID 
      GROUP BY t.TYPEID, tt.NAME 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('📊 Görev tipi dağılımı:');
    typeStats.forEach(stat => {
      const typeName = stat.NAME || 'Bilinmeyen';
      console.log(`   - ${stat.TYPEID}: ${typeName} (${stat.count} görev)`);
    });
    
    // Foreign key kontrollerini tekrar aç
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('🎉 TASK TYPEID düzeltmeleri tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTaskTypes();