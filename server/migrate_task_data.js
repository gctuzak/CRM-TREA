const { sequelize } = require('./config/database');
const { Task, TaskType } = require('./models');
const mysql = require('mysql2/promise');

// Veritabanı bağlantı ayarları
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydatabase',
  charset: 'utf8mb4'
};

async function migrateTaskData() {
  let connection;
  
  try {
    console.log('Veritabanına bağlanılıyor...');
    connection = await mysql.createConnection(dbConfig);
    
    // Eski TASK tablosundaki verileri oku
    console.log('Eski TASK verilerini okuyuyor...');
    const [oldTasks] = await connection.execute(`
      SELECT 
        ID,
        TITLE,
        DESCRIPTION,
        CONTACT_ID,
        OPPORTUNITY_ID,
        ASSIGNED_TO,
        DUE_DATE,
        PRIORITY,
        STATUS,
        CREATED_AT,
        UPDATED_AT
      FROM TASK
      ORDER BY ID
    `);
    
    console.log(`${oldTasks.length} görev bulundu.`);
    
    if (oldTasks.length === 0) {
      console.log('Aktarılacak görev bulunamadı.');
      return;
    }
    
    // Varsayılan görev tipi oluştur veya bul
    let defaultTaskType;
    try {
      defaultTaskType = await TaskType.findOne({ where: { NAME: 'Genel' } });
      if (!defaultTaskType) {
        defaultTaskType = await TaskType.create({
          NAME: 'Genel',
          DESCRIPTION: 'Genel görevler için varsayılan tip'
        });
        console.log('Varsayılan görev tipi oluşturuldu.');
      }
    } catch (error) {
      console.log('Varsayılan görev tipi oluşturulamadı, TYPEID = 1 kullanılacak.');
      defaultTaskType = { ID: 1 };
    }
    
    // Eski tabloyu yedekle
    console.log('Eski TASK tablosu yedekleniyor...');
    await connection.execute('DROP TABLE IF EXISTS TASK_BACKUP');
    await connection.execute(`
      CREATE TABLE TASK_BACKUP AS 
      SELECT * FROM TASK
    `);
    
    // Eski tabloyu temizle
    console.log('Eski TASK tablosu temizleniyor...');
    await connection.execute('DELETE FROM TASK');
    
    // Yeni yapıya göre verileri aktar
    console.log('Veriler yeni yapıya aktarılıyor...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const oldTask of oldTasks) {
      try {
        // Status değerlerini eşleştir
        let newStatus = 'New';
        if (oldTask.STATUS) {
          switch (oldTask.STATUS.toLowerCase()) {
            case 'completed':
            case 'done':
            case 'finished':
              newStatus = 'Completed';
              break;
            case 'in progress':
            case 'in_progress':
            case 'working':
            case 'active':
              newStatus = 'In progress';
              break;
            default:
              newStatus = 'New';
          }
        }
        
        // Yeni görev oluştur
        const newTaskData = {
          ID: oldTask.ID,
          USERID: oldTask.ASSIGNED_TO || 1, // Varsayılan kullanıcı
          DATETIME: oldTask.CREATED_AT || new Date(),
          DATETIMEDUE: oldTask.DUE_DATE,
          NOTE: oldTask.TITLE + (oldTask.DESCRIPTION ? '\n\n' + oldTask.DESCRIPTION : ''),
          STATUS: newStatus,
          TYPEID: defaultTaskType.ID,
          CONTACTID: oldTask.CONTACT_ID,
          OPPORTUNITYID: oldTask.OPPORTUNITY_ID || 0,
          ORID: oldTask.ID, // ORID alanı için ID'yi kullan
          DATETIMEEDIT: oldTask.UPDATED_AT,
          USERIDEDIT: oldTask.ASSIGNED_TO || 1,
          PARENTTASKID: 0,
          LEADID: 0,
          JOBID: 0,
          STAMP: new Date()
        };
        
        // Sequelize kullanarak kaydet
        await Task.create(newTaskData);
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`${successCount} görev aktarıldı...`);
        }
        
      } catch (error) {
        console.error(`Görev ID ${oldTask.ID} aktarılırken hata:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\nAktarım tamamlandı:`);
    console.log(`- Başarılı: ${successCount}`);
    console.log(`- Hatalı: ${errorCount}`);
    console.log(`- Toplam: ${oldTasks.length}`);
    
    // Sonuçları kontrol et
    const newTaskCount = await Task.count();
    console.log(`\nYeni TASK tablosunda ${newTaskCount} görev bulunuyor.`);
    
  } catch (error) {
    console.error('Veri aktarım hatası:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Script'i çalıştır
if (require.main === module) {
  migrateTaskData()
    .then(() => {
      console.log('Veri aktarımı tamamlandı.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script hatası:', error);
      process.exit(1);
    });
}

module.exports = { migrateTaskData };