const fs = require('fs');
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importTasksOnly() {
  let connection;
  
  try {
    console.log('🎯 Sadece TASK verilerini orijinal backup\'tan aktarıyor...');
    
    // Yedek dosyası adayları (var olan ilk dosyayı kullan)
    const candidateFiles = [
      '../mydatabase_backup.sql',
      './mydatabase_backup_clean.sql',
      './mydatabase_backup_final_fixed.sql',
      './mydatabase_backup_comprehensive.sql',
    ];
    const backupFile = candidateFiles.map(p => require('path').resolve(__dirname, p))
      .find(p => fs.existsSync(p));
    if (!backupFile) {
      console.error('❌ Yedek dosyası bulunamadı (arananlar: ../mydatabase_backup.sql, server/mydatabase_backup_*.sql)');
      return;
    }
    console.log(`📄 Kullanılan yedek: ${backupFile}`);
    
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'migration_user',
      password: process.env.DB_PASSWORD || 'migration_pass',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Veritabanı bağlantısı kuruldu');
    
    // Mevcut task sayısını kontrol et
    const [beforeCount] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`📊 Mevcut TASK sayısı: ${beforeCount[0].count}`);
    
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
    
    // Mevcut TASK verilerini temizle
    console.log('🧹 Mevcut TASK verileri temizleniyor...');
    await connection.execute('DELETE FROM TASK');
    await connection.execute('ALTER TABLE TASK AUTO_INCREMENT = 1');
    
    // Sadece TASK verilerini çıkar ve yükle
    console.log('📊 TASK verileri çıkarılıyor ve yükleniyor...');
    
    const extractCommand = `
      docker exec ${container} bash -c "
        # TASK verilerini çıkar
        grep -A 10000 'INSERT INTO \\\`TASK\\\` VALUES' /tmp/original_backup.sql | grep -B 10000 'UNLOCK TABLES' | head -n -1 > /tmp/task_data.sql
        
        # Charset ayarla ve TASK verilerini yükle
        mysql -ucrmuser -pcrmpassword --default-character-set=utf8mb4 mydatabase -e 'SET NAMES utf8mb4; SET CHARACTER SET utf8mb4;'
        mysql -ucrmuser -pcrmpassword --default-character-set=utf8mb4 mydatabase < /tmp/task_data.sql
        
        # Temizlik
        rm /tmp/original_backup.sql /tmp/task_data.sql
      "
    `;
    
    try {
      // Docker yöntemini atla, direkt manuel yöntemi kullan
      throw new Error('Manuel yöntem kullanılacak');
    } catch (dockerError) {
      console.warn('⚠️ Manuel yöntem kullanılıyor...');
      
      // Alternatif: Backup dosyasını okuyup manuel işle
      console.log('📖 Backup dosyası manuel olarak işleniyor...');
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      
      // TASK INSERT bloğunu bul - bitişi ENABLE KEYS satırıyla belirle
      const taskInsertStart = backupContent.indexOf("INSERT INTO `TASK` VALUES");
      const enableKeysMarker = '/*!40000 ALTER TABLE `TASK` ENABLE KEYS */';
      const taskInsertEnd = enableKeysMarker && taskInsertStart !== -1
        ? backupContent.indexOf(enableKeysMarker, taskInsertStart)
        : -1;
      
      if (taskInsertStart !== -1 && taskInsertEnd !== -1) {
        let insertStatement = backupContent.substring(taskInsertStart, taskInsertEnd).trim();
        if (!insertStatement.endsWith(';')) insertStatement += ';';
        
        console.log(`📏 INSERT statement uzunluğu: ${insertStatement.length} karakter`);
        
        // Charset ayarla
        await connection.execute('SET NAMES utf8mb4');
        await connection.execute('SET CHARACTER SET utf8mb4');
        
        // Çok uzun statement'ı parçalara böl
        console.log('🔄 Büyük INSERT statement parçalara bölünüyor...');
        
        // VALUES kısmını çıkar
        const valuesStart = insertStatement.indexOf('VALUES') + 6;
        const valuesString = insertStatement.substring(valuesStart, insertStatement.length - 1); // Son ';' hariç
        
        // Her bir değer grubunu bul
        const valueGroups = [];
        let currentGroup = '';
        let parenCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < valuesString.length; i++) {
          const char = valuesString[i];
          
          if (escapeNext) {
            currentGroup += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            currentGroup += char;
            continue;
          }
          
          if (char === "'" && !escapeNext) {
            inString = !inString;
          }
          
          if (!inString) {
            if (char === '(') {
              parenCount++;
            } else if (char === ')') {
              parenCount--;
            }
          }
          
          currentGroup += char;
          
          if (!inString && parenCount === 0 && char === ')') {
            // Bir grup tamamlandı
            valueGroups.push(currentGroup.trim());
            currentGroup = '';
            
            // Virgülü atla
            if (i + 1 < valuesString.length && valuesString[i + 1] === ',') {
              i++;
            }
          }
        }
        
        console.log(`📊 ${valueGroups.length} değer grubu bulundu`);
        
        // Grupları 100'er 100'er işle
        const batchSize = 100;
        let successCount = 0;
        
        for (let i = 0; i < valueGroups.length; i += batchSize) {
          const batch = valueGroups.slice(i, i + batchSize);
          const batchInsert = `INSERT INTO TASK VALUES ${batch.join(',')}`;
          
          try {
            await connection.execute(batchInsert);
            successCount += batch.length;
            console.log(`📥 İşlenen kayıt: ${successCount}/${valueGroups.length}`);
          } catch (batchError) {
            console.warn(`⚠️ Batch ${i}-${i + batch.length} hatası, tek tek deneniyor...`);
            
            // Batch başarısız olursa tek tek dene
            for (const value of batch) {
              try {
                const singleInsert = `INSERT INTO TASK VALUES ${value}`;
                await connection.execute(singleInsert);
                successCount++;
              } catch (singleError) {
                // Sessizce devam et
              }
            }
          }
        }
        
        console.log(`✅ ${successCount} kayıt başarıyla yüklendi`);
      } else {
        console.error('❌ Backup dosyasında TASK INSERT statement bulunamadı');
      }
    }
    
    // Sonuçları kontrol et
    const [afterCount] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    console.log(`📊 Yüklenen TASK sayısı: ${afterCount[0].count}`);
    
    if (afterCount[0].count > 0) {
      // İlk 5 görevi göster
      const [sampleTasks] = await connection.execute(`
        SELECT ID, NOTE, STATUS, DATETIME, DATETIMEDUE 
        FROM TASK 
        ORDER BY ID 
        LIMIT 5
      `);
      
      console.log('\n📋 İlk 5 görev:');
      sampleTasks.forEach(task => {
        const notePreview = task.NOTE ? task.NOTE.substring(0, 60) + '...' : 'Boş';
        const dueDate = task.DATETIMEDUE ? new Date(task.DATETIMEDUE).toLocaleDateString('tr-TR') : 'Yok';
        console.log(`  ID: ${task.ID} | Durum: ${task.STATUS} | Bitiş: ${dueDate}`);
        console.log(`    Not: ${notePreview}`);
      });
      
      // Durum dağılımını göster
      const [statusStats] = await connection.execute(`
        SELECT STATUS, COUNT(*) as count 
        FROM TASK 
        GROUP BY STATUS 
        ORDER BY count DESC
      `);
      
      console.log('\n📊 Durum dağılımı:');
      statusStats.forEach(stat => {
        console.log(`  ${stat.STATUS}: ${stat.count} görev`);
      });
      
      // Türkçe karakter testi
      const [turkishTest] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM TASK 
        WHERE NOTE LIKE '%ş%' OR NOTE LIKE '%ğ%' OR NOTE LIKE '%ü%' OR NOTE LIKE '%ö%' OR NOTE LIKE '%ç%' OR NOTE LIKE '%İ%'
      `);
      
      console.log(`\n🇹🇷 Türkçe karakter içeren görevler: ${turkishTest[0].count}`);
    }
    
    console.log('\n🎉 TASK verileri başarıyla aktarıldı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Script'i çalıştır
if (require.main === module) {
  importTasksOnly();
}

module.exports = importTasksOnly;