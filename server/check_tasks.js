const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTasks() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });

    console.log('📋 TASK tablosu kontrol ediliyor...\n');

    // TASK tablosu var mı?
    try {
      const [taskCount] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
      console.log(`📊 TASK tablosunda ${taskCount[0].count} kayıt var`);
      
      if (taskCount[0].count > 0) {
        // İlk 5 görevi göster
        console.log('\n📋 İlk 5 görev:');
        const [tasks] = await connection.execute('SELECT ID, NOTE, STATUS, USERID FROM TASK LIMIT 5');
        tasks.forEach(task => {
          const notePreview = task.NOTE ? task.NOTE.substring(0, 50) + '...' : 'Boş';
          console.log(`  ID: ${task.ID} | Not: ${notePreview} | Durum: ${task.STATUS} | Kullanıcı: ${task.USERID}`);
        });
      }
    } catch (error) {
      console.log('❌ TASK tablosu bulunamadı:', error.message);
    }

    // TASK tablosunun yapısını kontrol et
    console.log('\n🔍 TASK tablosu yapısı:');
    try {
      const [columns] = await connection.execute('DESCRIBE TASK');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
    } catch (error) {
      console.log('❌ TASK tablosu yapısı alınamadı:', error.message);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error.message);
  }
}

checkTasks();