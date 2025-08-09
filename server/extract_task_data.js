const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function extractAndLoadTaskData() {
  try {
    console.log('📋 Orijinal backup\'tan TASK verileri çıkarılıyor...');
    
    const backupFile = '../mydatabase_backup.sql';
    const content = fs.readFileSync(backupFile, 'utf8');
    
    // TASK INSERT verilerini bul
    const taskInsertMatch = content.match(/INSERT INTO `TASK` VALUES[\s\S]*?(?=;)/);
    
    if (!taskInsertMatch) {
      console.log('❌ TASK INSERT verisi bulunamadı');
      return;
    }
    
    let taskInsertData = taskInsertMatch[0];
    console.log('✅ TASK INSERT verisi bulundu');
    
    // Charset sorunlarını düzelt
    taskInsertData = taskInsertData
      .replace(/utf8mb3/g, 'utf8mb4')
      .replace(/utf8mb3_turkish_ci/g, 'utf8mb4_unicode_ci');
    
    // Veritabanına bağlan
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('📊 TASK verileri yükleniyor...');
    
    // TASK verilerini yükle
    await connection.execute(taskInsertData + ';');
    
    // Kontrol et
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`✅ ${result[0].count} TASK kaydı başarıyla yüklendi`);
    
    // İlk 5 görevi göster
    const [tasks] = await connection.execute('SELECT ID, NOTE, STATUS FROM TASK LIMIT 5');
    console.log('\n📋 İlk 5 görev:');
    tasks.forEach(task => {
      const notePreview = task.NOTE ? task.NOTE.substring(0, 60) + '...' : 'Boş';
      console.log(`  ID: ${task.ID} | Durum: ${task.STATUS} | Not: ${notePreview}`);
    });
    
    await connection.end();
    console.log('\n🎉 TASK verileri başarıyla yüklendi!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

extractAndLoadTaskData();