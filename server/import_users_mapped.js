const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importUsersMapped() {
  let connection;
  
  try {
    console.log('🎯 USER verilerini mapping ile aktarıyor...');
    
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
    
    // INSERT statement'ını bul
    const insertStart = userSection.indexOf('INSERT INTO `USER` VALUES');
    if (insertStart === -1) {
      console.error('❌ INSERT statement bulunamadı');
      return;
    }
    
    const insertEnd = userSection.indexOf('/*!40000 ALTER TABLE `USER` ENABLE KEYS */', insertStart);
    if (insertEnd === -1) {
      console.error('❌ INSERT statement sonu bulunamadı');
      return;
    }
    
    let insertStatement = userSection.substring(insertStart, insertEnd).trim();
    
    // VALUES kısmını çıkar
    const valuesStart = insertStatement.indexOf('VALUES') + 6;
    const valuesString = insertStatement.substring(valuesStart);
    
    console.log('📊 USER verileri parse ediliyor...');
    
    // Mevcut USER verilerini temizle (test kullanıcısı hariç)
    console.log('🧹 Mevcut USER verileri temizleniyor...');
    await connection.execute('DELETE FROM USER WHERE ID != 1');
    
    // Her kullanıcıyı tek tek ekle
    const userMatches = valuesString.match(/\\(([^)]+)\\)/g);
    if (!userMatches) {
      console.error('❌ USER verileri parse edilemedi');
      return;
    }
    
    let insertedCount = 0;
    
    for (const userMatch of userMatches) {
      try {
        // Parantezleri kaldır
        const userValues = userMatch.slice(1, -1);
        
        // Basit parsing - sadece ilk birkaç değeri al
        const values = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < userValues.length; i++) {
          const char = userValues[i];
          
          if (!inQuotes && (char === "'" || char === '"')) {
            inQuotes = true;
            quoteChar = char;
            current += char;
          } else if (inQuotes && char === quoteChar) {
            // Escape kontrolü
            if (userValues[i-1] !== '\\\\') {
              inQuotes = false;
              quoteChar = '';
            }
            current += char;
          } else if (!inQuotes && char === ',') {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        if (current.trim()) {
          values.push(current.trim());
        }
        
        if (values.length >= 5) {
          // Sadece temel alanları al: ID, NAME, EMAIL, PSW, KEYP
          const id = values[0];
          const name = values[1].replace(/^'|'$/g, ''); // Tırnakları kaldır
          const email = values[2].replace(/^'|'$/g, '');
          const password = values[3].replace(/^'|'$/g, '');
          const keyp = values[4] === 'NULL' ? null : values[4].replace(/^'|'$/g, '');
          
          // USER ekle
          await connection.execute(`
            INSERT INTO USER (ID, NAME, EMAIL, PASSWORD, KEYP, STATUS, ROLE) 
            VALUES (?, ?, ?, ?, ?, 'active', 'user')
          `, [id, name, email, password, keyp]);
          
          insertedCount++;
        }
        
      } catch (error) {
        console.warn(`⚠️ Kullanıcı eklenirken hata: ${error.message}`);
      }
    }
    
    console.log(`📊 Yüklenen USER sayısı: ${insertedCount}`);
    
    // Kullanıcı isimlerini göster
    const [users] = await connection.execute('SELECT ID, NAME FROM USER WHERE ID != 1 LIMIT 5');
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

importUsersMapped();