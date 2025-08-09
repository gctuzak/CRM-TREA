const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTaskDates() {
  let connection;
  
  try {
    console.log('🎯 TASK tarih bilgilerini kontrol ediyorum...');
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu');
    
    // Tarih bilgisi olan TASK'ları say
    const [withDateTime] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE DATETIME IS NOT NULL
    `);
    
    const [withDateTimeDue] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE DATETIMEDUE IS NOT NULL
    `);
    
    const [withAnyDate] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE DATETIME IS NOT NULL OR DATETIMEDUE IS NOT NULL
    `);
    
    console.log(`📊 DATETIME bilgisi olan görevler: ${withDateTime[0].count}`);
    console.log(`📊 DATETIMEDUE bilgisi olan görevler: ${withDateTimeDue[0].count}`);
    console.log(`📊 Herhangi bir tarih bilgisi olan görevler: ${withAnyDate[0].count}`);
    
    // Tarih bilgisi olan ilk birkaç TASK'ı göster
    if (withAnyDate[0].count > 0) {
      const [sampleTasks] = await connection.execute(`
        SELECT ID, DATETIME, DATETIMEDUE, NOTE 
        FROM TASK 
        WHERE DATETIME IS NOT NULL OR DATETIMEDUE IS NOT NULL 
        LIMIT 5
      `);
      
      console.log('\n📋 Tarih bilgisi olan örnek görevler:');
      sampleTasks.forEach(task => {
        console.log(`   - ID: ${task.ID}`);
        console.log(`     DATETIME: ${task.DATETIME}`);
        console.log(`     DATETIMEDUE: ${task.DATETIMEDUE}`);
        console.log(`     NOTE: ${task.NOTE ? task.NOTE.substring(0, 50) + '...' : 'Boş'}`);
        console.log('');
      });
    }
    
    // Backup'taki TASK yapısını hatırlayalım
    console.log('\n📝 Backup\'taki TASK yapısı:');
    console.log('   (ID, USERID, DATETIME, DATETIMEDUE, NOTE, STATUS, TYPEID, CONTACTID, ...)');
    console.log('   İlk kayıt: (1,29606,NULL,NULL,\'...\',\'Completed\',2,25,...)');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTaskDates();