const mysql = require('mysql2/promise');
require('dotenv').config();

async function importFewTasks() {
  let connection;
  
  try {
    console.log('🎯 İlk birkaç TASK verilerini test ediyorum...');
    
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
    
    // Mevcut TASK verilerini temizle
    console.log('🧹 Mevcut TASK verileri temizleniyor...');
    await connection.execute('DELETE FROM TASK');
    await connection.execute('ALTER TABLE TASK AUTO_INCREMENT = 1');
    
    // Test TASK'ları ekle
    const testTasks = [
      {
        ID: 1,
        USERID: 29606,
        NOTE: 'Test task 1',
        STATUS: 'Completed',
        TYPEID: 2,
        CONTACTID: 25,
        ORID: 10776
      },
      {
        ID: 2,
        USERID: 29606,
        NOTE: 'Test task 2',
        STATUS: 'In progress',
        TYPEID: 15,
        CONTACTID: 25,
        ORID: 10776
      }
    ];
    
    let insertedCount = 0;
    
    for (const task of testTasks) {
      try {
        await connection.execute(`
          INSERT INTO TASK (ID, USERID, NOTE, STATUS, TYPEID, CONTACTID, ORID) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [task.ID, task.USERID, task.NOTE, task.STATUS, task.TYPEID, task.CONTACTID, task.ORID]);
        
        insertedCount++;
        console.log(`✅ Eklendi: Task ${task.ID}`);
        
      } catch (error) {
        console.warn(`⚠️ Task ${task.ID} eklenirken hata: ${error.message}`);
      }
    }
    
    // Foreign key kontrollerini tekrar aç
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log(`📊 Yüklenen TASK sayısı: ${insertedCount}`);
    
    // Sonuçları kontrol et
    const [tasks] = await connection.execute('SELECT ID, NOTE, STATUS FROM TASK LIMIT 5');
    console.log('📋 Yüklenen TASK\'lar:');
    tasks.forEach(task => {
      console.log(`   - ${task.ID}: ${task.NOTE.substring(0, 50)}... [${task.STATUS}]`);
    });
    
    console.log('🎉 Test TASK verileri başarıyla aktarıldı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importFewTasks();