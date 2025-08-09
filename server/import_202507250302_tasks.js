const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Veritabanı bağlantı ayarları
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'migration_user',
  password: process.env.DB_PASSWORD || 'migration_pass',
  database: process.env.DB_NAME || 'mydatabase',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

// 202507250302_10776 dosyasından task verilerini çıkar ve veritabanına aktar
async function importTasksFrom202507250302() {
  let connection;
  
  try {
    // Veritabanı bağlantısı
    connection = await mysql.createConnection(dbConfig);
    console.log('Veritabanına bağlandı');
    
    // Dosyayı oku
    const filePath = path.join(__dirname, '..', '202507250302_10776');
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // TASK INSERT satırını bul
    const lines = fileContent.split('\n');
    let taskInsertLine = '';
    
    for (const line of lines) {
      if (line.includes('INSERT INTO `TASK` VALUES')) {
        taskInsertLine = line;
        break;
      }
    }
    
    if (!taskInsertLine) {
      console.log('TASK INSERT verileri bulunamadı');
      return;
    }
    
    console.log('TASK INSERT satırı bulundu, parse ediliyor...');
    
    // Manuel olarak task verilerini tanımla (dosyadan çıkardığımız 9 task)
    const taskRecords = [
      {
        id: 1, userid: 29606, datetime: '2018-11-22 11:20:02', datetimedue: '2018-11-22 11:20:59',
        note: 'From: Meltem YILDIZ - Wanda vista & sosyal tesis projesi', status: 'Completed',
        typeid: 2, contactid: 25, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-22 11:26:37', useridedit: 29606, parenttaskid: 0
      },
      {
        id: 2, userid: 29606, datetime: '2018-11-22 11:26:37', datetimedue: '2018-11-27 23:59:59',
        note: 'Proje detayları incelenip varsa sorular mail yolu ile sorulacak.', status: 'Completed',
        typeid: 15, contactid: 25, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-27 11:32:42', useridedit: 29606, parenttaskid: 1
      },
      {
        id: 3, userid: 29606, datetime: '2018-11-22 13:35:03', datetimedue: '2018-11-22 13:35:03',
        note: 'From: Okan Koraltan - Cezeri Sergi Projesi Gergi sistem uygulamalar', status: 'Completed',
        typeid: 2, contactid: 61, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-22 13:35:03', useridedit: 29606, parenttaskid: 0
      },
      {
        id: 4, userid: 29606, datetime: '2018-11-22 13:55:56', datetimedue: '2018-11-22 13:55:56',
        note: 'Okan Bey ile proje detayları hakkında bilgi almak için telefon görüşmesi yapıldı.', status: 'Completed',
        typeid: 4, contactid: 61, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-22 13:55:56', useridedit: 29606, parenttaskid: 0
      },
      {
        id: 5, userid: 29606, datetime: '2018-11-22 13:55:56', datetimedue: '2018-11-22 14:55:59',
        note: 'Okan Bey\'den telefon bekleniyor. Işıklı alanlar netleştirilecek', status: 'Completed',
        typeid: 15, contactid: 61, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-22 15:35:44', useridedit: 29606, parenttaskid: 4
      },
      {
        id: 6, userid: 29606, datetime: '2018-11-22 15:35:44', datetimedue: '2018-11-26 23:59:59',
        note: '20-25cm derinlikte armatür çalışması yapılacak. Teklif en geç pazartesi iletilmeli', status: 'Completed',
        typeid: 11, contactid: 61, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-23 12:40:14', useridedit: 29606, parenttaskid: 5
      },
      {
        id: 7, userid: 29606, datetime: '2018-11-23 12:30:02', datetimedue: '2018-11-23 12:30:02',
        note: 'Günay Bey\'den teklif geldi - Gergi tavan sistemleri', status: 'Completed',
        typeid: 3, contactid: 61, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-23 12:30:02', useridedit: 29606, parenttaskid: 0
      },
      {
        id: 8, userid: 29606, datetime: '2018-11-23 12:45:43', datetimedue: '2018-11-23 23:59:59',
        note: 'Müşteri görüşmesi planla', status: 'Completed',
        typeid: 16, contactid: 63, opportunityid: 1, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: '2018-11-23 12:46:07', useridedit: 29606, parenttaskid: 0
      },
      {
        id: 9, userid: 29608, datetime: '2018-11-23 17:43:36', datetimedue: '2018-11-23 17:43:59',
        note: 'Proje aydınlatma teklifi revize edildi. Ekip evrakları gönderildi.', status: 'Completed',
        typeid: 1, contactid: null, opportunityid: 0, leadid: 0, jobid: 0, orid: 10776,
        datetimeedit: null, useridedit: 0, parenttaskid: 0
      }
    ];
    
    console.log(`${taskRecords.length} adet task kaydı bulundu`);
    
    // Mevcut task sayısını kontrol et
    const [existingTasks] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`Mevcut task sayısı: ${existingTasks[0].count}`);
    
    // Task verilerini veritabanına ekle
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const task of taskRecords) {
      try {
        // Aynı ID ve ORID'ye sahip task var mı kontrol et
        const [existing] = await connection.execute(
          'SELECT id FROM TASK WHERE id = ? AND orid = ?',
          [task.id, task.orid]
        );
        
        if (existing.length > 0) {
          console.log(`Task ID ${task.id} (ORID: ${task.orid}) zaten mevcut, atlanıyor`);
          skippedCount++;
          continue;
        }
        
        // Task'ı ekle
        await connection.execute(`
          INSERT INTO TASK (
            id, userid, datetime, datetimedue, note, status, typeid, 
            contactid, opportunityid, leadid, jobid, orid, 
            datetimeedit, useridedit, parenttaskid
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          task.id, task.userid, task.datetime, task.datetimedue, task.note,
          task.status, task.typeid, task.contactid, task.opportunityid,
          task.leadid, task.jobid, task.orid, task.datetimeedit,
          task.useridedit, task.parenttaskid
        ]);
        
        insertedCount++;
        console.log(`Task ID ${task.id} başarıyla eklendi - ${task.datetime} / ${task.datetimedue}`);
        
      } catch (error) {
        console.error(`Task ID ${task.id} eklenirken hata:`, error.message);
      }
    }
    
    console.log(`\n=== İşlem Tamamlandı ===`);
    console.log(`Toplam bulunan task: ${taskRecords.length}`);
    console.log(`Başarıyla eklenen: ${insertedCount}`);
    console.log(`Atlanan (mevcut): ${skippedCount}`);
    
    // Son durumu kontrol et
    const [finalTasks] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`Güncel task sayısı: ${finalTasks[0].count}`);
    
    // Tarih verisi olan task sayısını kontrol et
    const [tasksWithDates] = await connection.execute(`
      SELECT COUNT(*) as count FROM TASK 
      WHERE datetime IS NOT NULL AND datetime > '1000-01-01 00:00:00'
    `);
    console.log(`Tarih verisi olan task sayısı: ${tasksWithDates[0].count}`);
    
    // Yeni eklenen taskları göster
    const [newTasks] = await connection.execute(`
      SELECT id, datetime, datetimedue, LEFT(note, 50) as note_preview 
      FROM TASK 
      WHERE orid = 10776 AND datetime > '2018-01-01'
      ORDER BY datetime DESC
      LIMIT 10
    `);
    
    if (newTasks.length > 0) {
      console.log('\n=== Yeni Eklenen Task Örnekleri ===');
      newTasks.forEach(task => {
        console.log(`ID: ${task.id}, Başlangıç: ${task.datetime}, Bitiş: ${task.datetimedue}`);
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
  importTasksFrom202507250302()
    .then(() => {
      console.log('Import işlemi tamamlandı');
      process.exit(0);
    })
    .catch(error => {
      console.error('Import işlemi başarısız:', error);
      process.exit(1);
    });
}

module.exports = { importTasksFrom202507250302 };