const mysql = require('mysql2/promise');
require('dotenv').config();

async function addBasicUsers() {
  let connection;
  
  try {
    console.log('🎯 Temel USER verilerini ekliyorum...');
    
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
    
    // TASK'larda kullanılan USER ID'leri
    const users = [
      { ID: 29606, NAME: 'Günay Çağrı Tuzak', EMAIL: 'gunay@itemyapi.com', PASSWORD: 'hashed_password_1' },
      { ID: 29607, NAME: 'X User', EMAIL: 'x@itemyapi.com', PASSWORD: 'hashed_password_2' },
      { ID: 29608, NAME: 'Hatice Dinç', EMAIL: 'hatice@itemyapi.com', PASSWORD: 'hashed_password_3' },
      { ID: 29682, NAME: 'Büşra Onak', EMAIL: 'busra@itemyapi.com', PASSWORD: 'hashed_password_4' },
      { ID: 29701, NAME: 'Funda Varlı Tuzak', EMAIL: 'funda@itemyapi.com', PASSWORD: 'hashed_password_5' },
      { ID: 30890, NAME: 'Pelin Kılıç', EMAIL: 'pelin@itemyapi.com', PASSWORD: 'hashed_password_6' },
      { ID: 32848, NAME: 'Tuğba Çayır', EMAIL: 'tugba@itemyapi.com', PASSWORD: 'hashed_password_7' },
      { ID: 35821, NAME: 'Yağmur Aydın', EMAIL: 'yagmur@itemyapi.com', PASSWORD: 'hashed_password_8' },
      { ID: 35822, NAME: 'Fatma Esra Kaya', EMAIL: 'esra@itemyapi.com', PASSWORD: 'hashed_password_9' }
    ];
    
    // Mevcut USER verilerini temizle (test kullanıcısı hariç)
    console.log('🧹 Mevcut USER verileri temizleniyor...');
    await connection.execute('DELETE FROM USER WHERE ID != 1');
    
    let insertedCount = 0;
    
    for (const user of users) {
      try {
        await connection.execute(`
          INSERT INTO USER (ID, NAME, EMAIL, PASSWORD, STATUS, ROLE) 
          VALUES (?, ?, ?, ?, 'active', 'user')
        `, [user.ID, user.NAME, user.EMAIL, user.PASSWORD]);
        
        insertedCount++;
        console.log(`✅ Eklendi: ${user.NAME}`);
        
      } catch (error) {
        console.warn(`⚠️ ${user.NAME} eklenirken hata: ${error.message}`);
      }
    }
    
    console.log(`📊 Yüklenen USER sayısı: ${insertedCount}`);
    
    // Sonuçları kontrol et
    const [newUsers] = await connection.execute('SELECT COUNT(*) as count FROM USER');
    console.log(`📊 Toplam USER sayısı: ${newUsers[0].count}`);
    
    console.log('🎉 USER verileri başarıyla aktarıldı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addBasicUsers();