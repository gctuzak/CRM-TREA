const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixZeroTypeId() {
  let connection;
  
  try {
    console.log('🎯 TYPEID=0 sorununu düzeltiyorum...');
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu');
    
    // TYPEID=0 olanları say
    const [zeroCount] = await connection.execute('SELECT COUNT(*) as count FROM TASK WHERE TYPEID = 0');
    console.log(`📊 TYPEID=0 olan görevler: ${zeroCount[0].count}`);
    
    if (zeroCount[0].count > 0) {
      // TYPEID=0 olanları TYPEID=99 yap (Genel Görev)
      console.log('🔄 TYPEID=0 olanları TYPEID=99 yapıyorum...');
      
      // Önce TASKTYPE=99 ekle
      try {
        await connection.execute(`
          INSERT INTO TASKTYPE (ID, NAME, ORID) 
          VALUES (99, 'Genel Görev', 10776)
        `);
        console.log('✅ TASKTYPE ID=99 eklendi');
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.warn(`⚠️ TASKTYPE eklenirken hata: ${error.message}`);
        }
      }
      
      // TYPEID=0 olanları 99 yap
      await connection.execute('UPDATE TASK SET TYPEID = 99 WHERE TYPEID = 0');
      console.log(`✅ ${zeroCount[0].count} görevin TYPEID'si 0'dan 99'a güncellendi`);
      
      // TASKTYPE=0'ı sil
      await connection.execute('DELETE FROM TASKTYPE WHERE ID = 0');
      console.log('✅ TASKTYPE ID=0 silindi');
    }
    
    // Sonuçları kontrol et
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM TASK WHERE TYPEID = 99');
    console.log(`📊 TYPEID=99 olan görevler: ${finalCount[0].count}`);
    
    console.log('🎉 TYPEID düzeltmeleri tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixZeroTypeId();