const mysql = require('mysql2/promise');
require('dotenv').config();

async function showTaskExamples() {
  let connection;
  
  try {
    console.log('🔍 En Detaylı Görev Örnekleri Gösteriliyor...');
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu\n');
    
    // En detaylı 3 görevi al
    const [tasks] = await connection.execute(`
      SELECT ID, NOTE, STATUS, TYPEID 
      FROM TASK 
      WHERE NOTE IS NOT NULL AND NOTE != '' 
      ORDER BY LENGTH(NOTE) DESC 
      LIMIT 3
    `);
    
    console.log('📋 EN DETAYLI 3 GÖREV ÖRNEĞİ:');
    console.log('='.repeat(80));
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`\n🎯 GÖREV ${i + 1}:`);
      console.log(`🆔 ID: ${task.ID}`);
      console.log(`📊 Durum: ${task.STATUS}`);
      console.log(`🏷️ Tip ID: ${task.TYPEID}`);
      console.log(`📏 Uzunluk: ${task.NOTE.length} karakter`);
      console.log(`📝 Detay Açıklama:`);
      console.log('-'.repeat(60));
      console.log(task.NOTE);
      console.log('='.repeat(80));
    }
    
    // Orta uzunlukta örnekler
    const [mediumTasks] = await connection.execute(`
      SELECT ID, NOTE, STATUS, TYPEID 
      FROM TASK 
      WHERE NOTE IS NOT NULL AND NOTE != '' 
        AND LENGTH(NOTE) BETWEEN 200 AND 1000
      ORDER BY RAND() 
      LIMIT 2
    `);
    
    console.log('\n📋 ORTA UZUNLUKTA GÖREV ÖRNEKLERİ:');
    console.log('='.repeat(80));
    
    for (let i = 0; i < mediumTasks.length; i++) {
      const task = mediumTasks[i];
      console.log(`\n📌 ÖRNEK ${i + 1}:`);
      console.log(`🆔 ID: ${task.ID}`);
      console.log(`📊 Durum: ${task.STATUS}`);
      console.log(`🏷️ Tip ID: ${task.TYPEID}`);
      console.log(`📏 Uzunluk: ${task.NOTE.length} karakter`);
      console.log(`📝 Detay:`);
      console.log('-'.repeat(40));
      console.log(task.NOTE);
      console.log('='.repeat(80));
    }
    
    console.log('\n🎉 Örnekler gösterildi!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showTaskExamples();