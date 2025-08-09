const mysql = require('mysql2/promise');
require('dotenv').config();

async function addTaskType() {
  let connection;
  
  try {
    console.log('🎯 TASKTYPE verilerini ekliyorum...');
    
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
    
    // TASKTYPE verilerini ekle
    const taskTypes = [
      { ID: 1, NAME: 'Fatura kesilecek' },
      { ID: 2, NAME: 'Gelen eposta' },
      { ID: 3, NAME: 'Giden eposta' },
      { ID: 4, NAME: 'Telefon görüşmesi' },
      { ID: 5, NAME: 'Müşteri ziyaret' },
      { ID: 6, NAME: 'Sevkiyat' },
      { ID: 7, NAME: 'Numune gönderimi' },
      { ID: 9, NAME: 'Şikayet/Arıza/Servis kaydı' },
      { ID: 11, NAME: 'Teklif verilecek' },
      { ID: 12, NAME: 'İmalat' },
      { ID: 15, NAME: 'Proje İnceleme' },
      { ID: 16, NAME: 'Teklif' }
    ];
    
    // Mevcut TASKTYPE verilerini temizle
    console.log('🧹 Mevcut TASKTYPE verileri temizleniyor...');
    await connection.execute('DELETE FROM TASKTYPE');
    
    let insertedCount = 0;
    
    for (const taskType of taskTypes) {
      try {
        await connection.execute(`
          INSERT INTO TASKTYPE (ID, NAME, ORID) 
          VALUES (?, ?, ?)
        `, [taskType.ID, taskType.NAME, 10776]);
        
        insertedCount++;
        console.log(`✅ Eklendi: ${taskType.NAME}`);
        
      } catch (error) {
        console.warn(`⚠️ ${taskType.NAME} eklenirken hata: ${error.message}`);
      }
    }
    
    console.log(`📊 Yüklenen TASKTYPE sayısı: ${insertedCount}`);
    
    console.log('🎉 TASKTYPE verileri başarıyla aktarıldı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addTaskType();