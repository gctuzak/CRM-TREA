const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTaskType() {
  let connection;
  
  try {
    console.log('🎯 TASKTYPE tablosunu kontrol ediyorum...');
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu');
    
    // TASKTYPE tablosundaki tüm kayıtları listele
    const [taskTypes] = await connection.execute('SELECT * FROM TASKTYPE ORDER BY ID');
    
    console.log('📊 TASKTYPE tablosundaki kayıtlar:');
    taskTypes.forEach(tt => {
      console.log(`   - ID: ${tt.ID}, NAME: ${tt.NAME}`);
    });
    
    // ID=0 var mı kontrol et
    const [zeroType] = await connection.execute('SELECT * FROM TASKTYPE WHERE ID = 0');
    console.log(`\n📊 ID=0 TASKTYPE: ${zeroType.length > 0 ? 'VAR' : 'YOK'}`);
    
    if (zeroType.length === 0) {
      console.log('➕ ID=0 TASKTYPE ekleniyor...');
      await connection.execute(`
        INSERT INTO TASKTYPE (ID, NAME, ORID) 
        VALUES (0, 'Genel Görev', 10776)
      `);
      console.log('✅ ID=0 TASKTYPE eklendi');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTaskType();