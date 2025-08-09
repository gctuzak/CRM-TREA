const mysql = require('mysql2/promise');
require('dotenv').config();

// Veritabanı bağlantı ayarları
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'migration_user',
  password: process.env.DB_PASSWORD || 'migration_pass',
  database: process.env.DB_NAME || 'mydatabase',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

// Task tarih verilerini güncelle
async function updateTaskDates() {
  let connection;
  
  try {
    // Veritabanı bağlantısı
    connection = await mysql.createConnection(dbConfig);
    console.log('Veritabanına bağlandı');
    
    // 202507250302_10776 dosyasından çıkardığımız gerçek tarih verileri
    const taskUpdates = [
      { id: 1, orid: 10776, datetime: '2018-11-22 11:20:02', datetimedue: '2018-11-22 11:20:59', datetimeedit: '2018-11-22 11:26:37' },
      { id: 2, orid: 10776, datetime: '2018-11-22 11:26:37', datetimedue: '2018-11-27 23:59:59', datetimeedit: '2018-11-27 11:32:42' },
      { id: 3, orid: 10776, datetime: '2018-11-22 13:35:03', datetimedue: '2018-11-22 13:35:03', datetimeedit: '2018-11-22 13:35:03' },
      { id: 4, orid: 10776, datetime: '2018-11-22 13:55:56', datetimedue: '2018-11-22 13:55:56', datetimeedit: '2018-11-22 13:55:56' },
      { id: 5, orid: 10776, datetime: '2018-11-22 13:55:56', datetimedue: '2018-11-22 14:55:59', datetimeedit: '2018-11-22 15:35:44' },
      { id: 6, orid: 10776, datetime: '2018-11-22 15:35:44', datetimedue: '2018-11-26 23:59:59', datetimeedit: '2018-11-23 12:40:14' },
      { id: 7, orid: 10776, datetime: '2018-11-23 12:30:02', datetimedue: '2018-11-23 12:30:02', datetimeedit: '2018-11-23 12:30:02' },
      { id: 8, orid: 10776, datetime: '2018-11-23 12:45:43', datetimedue: '2018-11-23 23:59:59', datetimeedit: '2018-11-23 12:46:07' },
      { id: 9, orid: 10776, datetime: '2018-11-23 17:43:36', datetimedue: '2018-11-23 17:43:59', datetimeedit: null }
    ];
    
    console.log(`${taskUpdates.length} adet task'ın tarihleri güncellenecek`);
    
    // Mevcut durumu kontrol et
    const [beforeUpdate] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE datetime IS NOT NULL AND datetime > '1000-01-01 00:00:00'
    `);
    console.log(`Güncelleme öncesi tarih verisi olan task sayısı: ${beforeUpdate[0].count}`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const task of taskUpdates) {
      try {
        // Task'ın var olup olmadığını kontrol et
        const [existing] = await connection.execute(
          'SELECT id FROM TASK WHERE id = ? AND orid = ?',
          [task.id, task.orid]
        );
        
        if (existing.length === 0) {
          console.log(`Task ID ${task.id} (ORID: ${task.orid}) bulunamadı`);
          notFoundCount++;
          continue;
        }
        
        // Task tarihlerini güncelle
        const result = await connection.execute(`
          UPDATE TASK 
          SET datetime = ?, datetimedue = ?, datetimeedit = ?
          WHERE id = ? AND orid = ?
        `, [
          task.datetime, 
          task.datetimedue, 
          task.datetimeedit,
          task.id, 
          task.orid
        ]);
        
        if (result[0].affectedRows > 0) {
          updatedCount++;
          console.log(`✅ Task ID ${task.id} tarihleri güncellendi: ${task.datetime} → ${task.datetimedue}`);
        }
        
      } catch (error) {
        console.error(`❌ Task ID ${task.id} güncellenirken hata:`, error.message);
      }
    }
    
    console.log(`\n=== Güncelleme Tamamlandı ===`);
    console.log(`Toplam işlenen task: ${taskUpdates.length}`);
    console.log(`Başarıyla güncellenen: ${updatedCount}`);
    console.log(`Bulunamayan: ${notFoundCount}`);
    
    // Güncelleme sonrası durumu kontrol et
    const [afterUpdate] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE datetime IS NOT NULL AND datetime > '1000-01-01 00:00:00'
    `);
    console.log(`Güncelleme sonrası tarih verisi olan task sayısı: ${afterUpdate[0].count}`);
    
    // Güncellenen taskları göster
    const [updatedTasks] = await connection.execute(`
      SELECT id, datetime, datetimedue, LEFT(note, 60) as note_preview 
      FROM TASK 
      WHERE orid = 10776 AND datetime > '2018-01-01'
      ORDER BY datetime
    `);
    
    if (updatedTasks.length > 0) {
      console.log('\n=== Güncellenen Tasklar ===');
      updatedTasks.forEach(task => {
        console.log(`ID: ${task.id}`);
        console.log(`Başlangıç: ${task.datetime}`);
        console.log(`Bitiş: ${task.datetimedue}`);
        console.log(`Not: ${task.note_preview}...\n`);
      });
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Veritabanı bağlantısı kapatıldı');
    }
  }
}

// Scripti çalıştır
if (require.main === module) {
  updateTaskDates()
    .then(() => {
      console.log('Tarih güncelleme işlemi tamamlandı');
      process.exit(0);
    })
    .catch(error => {
      console.error('Tarih güncelleme işlemi başarısız:', error);
      process.exit(1);
    });
}

module.exports = { updateTaskDates };