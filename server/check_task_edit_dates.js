const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTaskEditDates() {
  let connection;
  
  try {
    console.log('🎯 TASK DATETIMEEDIT bilgilerini kontrol ediyorum...');
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu');
    
    // DATETIMEEDIT bilgisi olan TASK'ları say
    const [withEditDate] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE DATETIMEEDIT IS NOT NULL
    `);
    
    console.log(`📊 DATETIMEEDIT bilgisi olan görevler: ${withEditDate[0].count}`);
    
    // DATETIMEEDIT bilgisi olan ilk birkaç TASK'ı göster
    if (withEditDate[0].count > 0) {
      const [sampleTasks] = await connection.execute(`
        SELECT ID, DATETIME, DATETIMEDUE, DATETIMEEDIT, NOTE 
        FROM TASK 
        WHERE DATETIMEEDIT IS NOT NULL 
        ORDER BY DATETIMEEDIT DESC
        LIMIT 5
      `);
      
      console.log('\\n📋 DATETIMEEDIT bilgisi olan örnek görevler:');
      sampleTasks.forEach(task => {
        console.log(`   - ID: ${task.ID}`);
        console.log(`     DATETIME: ${task.DATETIME}`);
        console.log(`     DATETIMEDUE: ${task.DATETIMEDUE}`);
        console.log(`     DATETIMEEDIT: ${task.DATETIMEEDIT}`);
        console.log(`     NOTE: ${task.NOTE ? task.NOTE.substring(0, 50) + '...' : 'Boş'}`);
        console.log('');
      });
    }
    
    // STAMP alanını da kontrol et
    const [withStamp] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE STAMP IS NOT NULL
    `);
    
    console.log(`📊 STAMP bilgisi olan görevler: ${withStamp[0].count}`);
    
    if (withStamp[0].count > 0) {
      const [stampSample] = await connection.execute(`
        SELECT ID, STAMP, NOTE 
        FROM TASK 
        WHERE STAMP IS NOT NULL 
        ORDER BY STAMP DESC
        LIMIT 3
      `);
      
      console.log('\\n⏰ STAMP bilgisi olan örnek görevler:');
      stampSample.forEach(task => {
        console.log(`   - ID: ${task.ID}, STAMP: ${task.STAMP}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTaskEditDates();