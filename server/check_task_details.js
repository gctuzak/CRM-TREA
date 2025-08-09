const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTaskDetails() {
  let connection;
  
  try {
    console.log('📋 TASK detay bilgileri kontrol ediliyor...');
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu');
    
    // İlk 10 görevin detay bilgilerini al
    const [tasks] = await connection.execute(`
      SELECT ID, NOTE, STATUS, TYPEID 
      FROM TASK 
      WHERE NOTE IS NOT NULL AND NOTE != '' 
      ORDER BY ID 
      LIMIT 10
    `);
    
    console.log('\n📋 İlk 10 görevin detay bilgileri:');
    console.log('=' .repeat(60));
    
    for (const task of tasks) {
      const notePreview = task.NOTE ? task.NOTE.substring(0, 150) : 'Boş';
      console.log(`🆔 ID: ${task.ID} | 📊 Status: ${task.STATUS} | 🏷️ Type: ${task.TYPEID}`);
      console.log(`📝 Note: ${notePreview}${task.NOTE && task.NOTE.length > 150 ? '...' : ''}`);
      console.log('-'.repeat(60));
    }
    
    // İstatistikleri al
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN NOTE IS NOT NULL AND NOTE != '' THEN 1 END) as with_notes,
        COUNT(CASE WHEN NOTE IS NULL OR NOTE = '' THEN 1 END) as without_notes
      FROM TASK
    `);
    
    console.log('\n📊 Detay Açıklama İstatistikleri:');
    console.log('=' .repeat(40));
    console.log(`📈 Toplam görev sayısı: ${stats[0].total}`);
    console.log(`✅ Detay açıklaması olan: ${stats[0].with_notes}`);
    console.log(`❌ Detay açıklaması olmayan: ${stats[0].without_notes}`);
    console.log(`📊 Detaylı görev oranı: ${((stats[0].with_notes / stats[0].total) * 100).toFixed(1)}%`);
    
    // En uzun notları göster
    const [longNotes] = await connection.execute(`
      SELECT ID, LENGTH(NOTE) as note_length, SUBSTRING(NOTE, 1, 100) as note_preview
      FROM TASK 
      WHERE NOTE IS NOT NULL AND NOTE != ''
      ORDER BY LENGTH(NOTE) DESC
      LIMIT 5
    `);
    
    console.log('\n📏 En uzun detay açıklamaları:');
    console.log('=' .repeat(50));
    longNotes.forEach(task => {
      console.log(`🆔 ID: ${task.ID} | 📏 Uzunluk: ${task.note_length} karakter`);
      console.log(`📝 Önizleme: ${task.note_preview}...`);
      console.log('-'.repeat(50));
    });
    
    console.log('\n🎉 Kontrol tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTaskDetails();