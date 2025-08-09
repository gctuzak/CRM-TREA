const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSampleTasks() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });

    console.log('📋 Örnek görevler ekleniyor...\n');

    // Önce bir kullanıcı ekleyelim
    try {
      await connection.execute(`
        INSERT INTO USER (ID, NAME, EMAIL, PASSWORD, STATUS) 
        VALUES (1, 'Test Kullanıcı', 'test@example.com', 'test123', 'active')
        ON DUPLICATE KEY UPDATE NAME = VALUES(NAME)
      `);
      console.log('✅ Test kullanıcısı eklendi/güncellendi');
    } catch (error) {
      console.log('⚠️ Kullanıcı ekleme hatası (devam ediliyor):', error.message);
    }

    // Örnek görevler
    const sampleTasks = [
      {
        note: 'Müşteri ile görüşme planla - Yeni proje için detayları konuş',
        status: 'New',
        userId: 1,
        contactId: 1,
        datetimeDue: '2025-08-10 14:00:00'
      },
      {
        note: 'Teklif hazırla - Proje için detaylı maliyet analizi yap',
        status: 'In progress',
        userId: 1,
        contactId: 2,
        datetimeDue: '2025-08-12 16:00:00'
      },
      {
        note: 'Sunum yap - Yönetim kuruluna aylık rapor sunumu',
        status: 'New',
        userId: 1,
        contactId: 3,
        datetimeDue: '2025-08-15 10:00:00'
      },
      {
        note: 'Dokümantasyon tamamla - Proje belgelerini hazırla',
        status: 'In progress',
        userId: 1,
        contactId: 4,
        datetimeDue: '2025-08-08 12:00:00'
      },
      {
        note: 'Müşteri geri bildirimi al - Tamamlanan iş hakkında görüş al',
        status: 'Completed',
        userId: 1,
        contactId: 5,
        datetimeDue: '2025-08-05 15:00:00'
      }
    ];

    for (let i = 0; i < sampleTasks.length; i++) {
      const task = sampleTasks[i];
      try {
        await connection.execute(`
          INSERT INTO TASK (
            ID, USERID, DATETIME, DATETIMEDUE, NOTE, STATUS, 
            TYPEID, CONTACTID, OPPORTUNITYID, LEADID, JOBID, 
            ORID, DATETIMEEDIT, USERIDEDIT, PARENTTASKID
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          i + 1,                    // ID
          task.userId,              // USERID
          new Date(),               // DATETIME
          task.datetimeDue,         // DATETIMEDUE
          task.note,                // NOTE
          task.status,              // STATUS
          1,                        // TYPEID
          task.contactId,           // CONTACTID
          0,                        // OPPORTUNITYID
          0,                        // LEADID
          0,                        // JOBID
          10000 + i,                // ORID
          new Date(),               // DATETIMEEDIT
          1,                        // USERIDEDIT
          0                         // PARENTTASKID
        ]);
        
        console.log(`✅ Görev ${i + 1} eklendi: ${task.note.substring(0, 30)}...`);
      } catch (error) {
        console.log(`❌ Görev ${i + 1} eklenirken hata:`, error.message);
      }
    }

    // Kontrol et
    const [tasks] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`\n📊 Toplam görev sayısı: ${tasks[0].count}`);

    // İlk 3 görevi göster
    const [sampleTasks2] = await connection.execute('SELECT ID, NOTE, STATUS, DATETIMEDUE FROM TASK LIMIT 3');
    console.log('\n📋 Eklenen görevler:');
    sampleTasks2.forEach(task => {
      console.log(`  ID: ${task.ID} | Durum: ${task.STATUS} | Not: ${task.NOTE.substring(0, 40)}...`);
    });

    await connection.end();
    console.log('\n✅ Örnek görevler başarıyla eklendi!');
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

addSampleTasks();