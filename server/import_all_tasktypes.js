const mysql = require('mysql2/promise');
require('dotenv').config();

async function importAllTaskTypes() {
  let connection;
  
  try {
    console.log('🎯 Tüm TASKTYPE verilerini backup\'tan aktarıyor...');
    
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
    
    // Backup'taki tüm TASKTYPE verileri
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
      { ID: 16, NAME: 'Teklif Onay Talebi' },
      { ID: 17, NAME: 'Teklif Durum Takibi' },
      { ID: 19, NAME: 'İşemri oluşturulacak' },
      { ID: 20, NAME: 'Montaj' },
      { ID: 23, NAME: 'Tahsilat Takibi' },
      { ID: 24, NAME: 'Toplantı' },
      { ID: 25, NAME: 'Teknik Servis' },
      { ID: 26, NAME: 'Keşif' },
      { ID: 27, NAME: 'Proje çizim' },
      { ID: 28, NAME: 'Teklif Gönderim Onayı' },
      { ID: 29, NAME: 'Cari Hesap Bilgileri' },
      { ID: 33, NAME: 'Aktivite/Görev bildirimi' },
      { ID: 34, NAME: 'Sipariş/Proje bildirimi' },
      { ID: 35, NAME: 'Prim Hakedişi' },
      { ID: 36, NAME: 'Toplu eposta' }
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
        console.log(`✅ Eklendi: ${taskType.ID} - ${taskType.NAME}`);
        
      } catch (error) {
        console.warn(`⚠️ ${taskType.NAME} eklenirken hata: ${error.message}`);
      }
    }
    
    console.log(`📊 Yüklenen TASKTYPE sayısı: ${insertedCount}`);
    
    // TASK'larda kullanılan TYPEID'leri kontrol et
    const [typeUsage] = await connection.execute(`
      SELECT TYPEID, COUNT(*) as count 
      FROM TASK 
      GROUP BY TYPEID 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('📊 En çok kullanılan görev tipleri:');
    for (const usage of typeUsage) {
      const [taskType] = await connection.execute('SELECT NAME FROM TASKTYPE WHERE ID = ?', [usage.TYPEID]);
      const typeName = taskType.length > 0 ? taskType[0].NAME : 'Bilinmeyen';
      console.log(`   - ${usage.TYPEID}: ${typeName} (${usage.count} görev)`);
    }
    
    console.log('🎉 Tüm TASKTYPE verileri başarıyla aktarıldı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importAllTaskTypes();