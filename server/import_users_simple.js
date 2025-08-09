const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importUsersSimple() {
  let connection;
  
  try {
    console.log('🎯 USER verilerini basit yöntemle aktarıyor...');
    
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
    
    // Mevcut USER sayısını kontrol et
    const [currentUsers] = await connection.execute('SELECT COUNT(*) as count FROM USER');
    console.log(`📊 Mevcut USER sayısı: ${currentUsers[0].count}`);
    
    // Backup dosyasını oku
    const backupFile = '../mydatabase_backup.sql';
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    
    // USER INSERT bölümünü bul
    const userLockStart = backupContent.indexOf('LOCK TABLES `USER` WRITE;');
    const userUnlockEnd = backupContent.indexOf('UNLOCK TABLES;', userLockStart);
    
    if (userLockStart === -1 || userUnlockEnd === -1) {
      console.error('❌ USER verileri bulunamadı');
      return;
    }
    
    const userSection = backupContent.substring(userLockStart, userUnlockEnd);
    console.log(`📏 USER bölümü uzunluğu: ${userSection.length} karakter`);
    
    // INSERT statement'ını bul
    const insertStart = userSection.indexOf('INSERT INTO `USER` VALUES');
    if (insertStart === -1) {
      console.error('❌ INSERT statement bulunamadı');
      return;
    }
    
    // INSERT statement'ının sonunu bul
    const insertEnd = userSection.indexOf('/*!40000 ALTER TABLE `USER` ENABLE KEYS */', insertStart);
    if (insertEnd === -1) {
      console.error('❌ INSERT statement sonu bulunamadı');
      return;
    }
    
    let insertStatement = userSection.substring(insertStart, insertEnd).trim();
    
    // Son noktalı virgülü ekle
    if (!insertStatement.endsWith(';')) {
      insertStatement += ';';
    }
    
    console.log(`📏 INSERT statement uzunluğu: ${insertStatement.length} karakter`);
    
    // Mevcut USER verilerini temizle (test kullanıcısı hariç)
    console.log('🧹 Mevcut USER verileri temizleniyor...');
    await connection.execute('DELETE FROM USER WHERE ID != 1');
    
    // INSERT statement'ını çalıştır
    console.log('📥 USER verileri yükleniyor...');
    await connection.execute(insertStatement);
    
    // Sonuçları kontrol et
    const [newUsers] = await connection.execute('SELECT COUNT(*) as count FROM USER');
    console.log(`📊 Yüklenen USER sayısı: ${newUsers[0].count}`);
    
    // Kullanıcı isimlerini göster
    const [users] = await connection.execute('SELECT ID, NAME FROM USER LIMIT 5');
    console.log('👥 İlk 5 kullanıcı:');
    users.forEach(user => {
      console.log(`   - ${user.ID}: ${user.NAME}`);
    });
    
    console.log('🎉 USER verileri başarıyla aktarıldı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importUsersSimple();