const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config();

async function loadTaskDataSafe() {
  try {
    console.log('📋 TASK verilerini güvenli yöntemle yüklüyor...');
    
    const backupFile = '../mydatabase_backup.sql';
    
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ ${backupFile} dosyası bulunamadı!`);
      return;
    }
    
    // Docker container'ı bul
    const containers = execSync('docker ps --format "{{.Names}}" --filter "ancestor=mysql"', { encoding: 'utf8' });
    const containerList = containers.trim().split('\n').filter(name => name);
    
    let container = null;
    if (containerList.length > 0) {
      container = containerList[0];
    } else {
      // Alternatif arama
      const allContainers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
      const allList = allContainers.trim().split('\n').filter(name => name);
      
      for (const cont of allList) {
        if (cont.toLowerCase().includes('mysql') || cont.toLowerCase().includes('db')) {
          container = cont;
          break;
        }
      }
    }
    
    if (!container) {
      console.error('❌ MySQL container bulunamadı');
      return;
    }
    
    console.log(`✅ MySQL container bulundu: ${container}`);
    
    // Backup dosyasını containera kopyala
    console.log('📁 Backup dosyası containera kopyalanıyor...');
    execSync(`docker cp "${backupFile}" ${container}:/tmp/original_backup.sql`);
    
    // Sadece TASK verilerini çıkar ve yükle
    console.log('📊 TASK verileri çıkarılıyor ve yükleniyor...');
    
    const extractCommand = `
      docker exec ${container} bash -c "
        # TASK verilerini çıkar
        sed -n '/INSERT INTO \`TASK\` VALUES/,/UNLOCK TABLES/p' /tmp/original_backup.sql > /tmp/task_data.sql
        
        # TASK verilerini yükle
        mysql -ucrmuser -pcrmpassword --default-character-set=utf8mb4 mydatabase < /tmp/task_data.sql
        
        # Temizlik
        rm /tmp/original_backup.sql /tmp/task_data.sql
      "
    `;
    
    execSync(extractCommand);
    
    console.log('✅ TASK verileri başarıyla yüklendi');
    
    // Kontrol et
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`📊 Toplam TASK sayısı: ${result[0].count}`);
    
    // İlk 3 görevi göster
    const [tasks] = await connection.execute('SELECT ID, NOTE, STATUS FROM TASK LIMIT 3');
    console.log('\n📋 İlk 3 görev:');
    tasks.forEach(task => {
      const notePreview = task.NOTE ? task.NOTE.substring(0, 80) + '...' : 'Boş';
      console.log(`  ID: ${task.ID} | Durum: ${task.STATUS} | Not: ${notePreview}`);
    });
    
    await connection.end();
    console.log('\n🎉 İşlem tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

loadTaskDataSafe();