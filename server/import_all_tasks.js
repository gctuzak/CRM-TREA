const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importAllTasks() {
  let connection;
  
  try {
    console.log('🎯 Tüm TASK verilerini backup\'tan aktarıyor...');
    
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
    
    // Mevcut TASK sayısını kontrol et
    const [currentTasks] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`📊 Mevcut TASK sayısı: ${currentTasks[0].count}`);
    
    // Backup dosyasını oku
    const backupFile = '../mydatabase_backup.sql';
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    
    // TASK INSERT bölümünü bul
    const taskLockStart = backupContent.indexOf('LOCK TABLES `TASK` WRITE;');
    const taskUnlockEnd = backupContent.indexOf('UNLOCK TABLES;', taskLockStart);
    
    if (taskLockStart === -1 || taskUnlockEnd === -1) {
      console.error('❌ TASK verileri bulunamadı');
      return;
    }
    
    const taskSection = backupContent.substring(taskLockStart, taskUnlockEnd);
    console.log(`📏 TASK bölümü uzunluğu: ${taskSection.length} karakter`);
    
    // INSERT statement'ını bul
    const insertStart = taskSection.indexOf('INSERT INTO `TASK` VALUES');
    if (insertStart === -1) {
      console.error('❌ INSERT statement bulunamadı');
      return;
    }
    
    const insertEnd = taskSection.indexOf('/*!40000 ALTER TABLE `TASK` ENABLE KEYS */', insertStart);
    if (insertEnd === -1) {
      console.error('❌ INSERT statement sonu bulunamadı');
      return;
    }
    
    let insertStatement = taskSection.substring(insertStart, insertEnd).trim();
    
    // Son noktalı virgülü ekle
    if (!insertStatement.endsWith(';')) {
      insertStatement += ';';
    }
    
    console.log(`📏 INSERT statement uzunluğu: ${insertStatement.length} karakter`);
    
    // Mevcut TASK verilerini temizle
    console.log('🧹 Mevcut TASK verileri temizleniyor...');
    await connection.execute('DELETE FROM TASK');
    
    // Foreign key kontrollerini geçici olarak kapat
    console.log('⚠️ Foreign key kontrollerini geçici olarak kapatıyorum...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // SQL mode'u ayarla (SET türü için)
    await connection.execute("SET sql_mode = ''");
    
    // INSERT statement'ını çalıştır
    console.log('📥 TASK verileri yükleniyor...');
    console.log('⏳ Bu işlem birkaç dakika sürebilir...');
    
    await connection.execute(insertStatement);
    
    // Foreign key kontrollerini tekrar aç
    console.log('✅ Foreign key kontrollerini tekrar açıyorum...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Sonuçları kontrol et
    const [newTasks] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`📊 Yüklenen TASK sayısı: ${newTasks[0].count}`);
    
    // Türkçe karakter kontrolü
    const [turkishTasks] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE NOTE LIKE '%ç%' OR NOTE LIKE '%ğ%' OR NOTE LIKE '%ı%' 
         OR NOTE LIKE '%ö%' OR NOTE LIKE '%ş%' OR NOTE LIKE '%ü%'
         OR NOTE LIKE '%Ç%' OR NOTE LIKE '%Ğ%' OR NOTE LIKE '%İ%' 
         OR NOTE LIKE '%Ö%' OR NOTE LIKE '%Ş%' OR NOTE LIKE '%Ü%'
    `);
    console.log(`🇹🇷 Türkçe karakter içeren görevler: ${turkishTasks[0].count}`);
    
    // Status dağılımını göster
    const [statusStats] = await connection.execute(`
      SELECT STATUS, COUNT(*) as count 
      FROM TASK 
      GROUP BY STATUS 
      ORDER BY count DESC
    `);
    console.log('📊 Status dağılımı:');
    statusStats.forEach(stat => {
      console.log(`   - ${stat.STATUS}: ${stat.count} görev`);
    });
    
    console.log('🎉 Tüm TASK verileri başarıyla aktarıldı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importAllTasks();