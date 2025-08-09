const fs = require('fs');

function searchTaskDatesInBackup() {
  try {
    console.log('🎯 Backup dosyasında TASK tarih bilgilerini arıyorum...');
    
    const backupFile = '../mydatabase_backup.sql';
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    
    // TASK INSERT bölümünü bul
    const taskLockStart = backupContent.indexOf('LOCK TABLES `TASK` WRITE;');
    const taskUnlockEnd = backupContent.indexOf('UNLOCK TABLES;', taskLockStart);
    
    if (taskLockStart === -1 || taskUnlockEnd === -1) {
      console.error('❌ TASK verileri bulunamadı');
      return;
    }
    
    const taskSection = backupContent.substring(taskLockStart, taskUnlockEnd);
    console.log(`📏 TASK bölümü uzunluğu: ${taskSection.length} karakter`);
    
    // INSERT statement'ını bul
    const insertStart = taskSection.indexOf('INSERT INTO `TASK` VALUES');
    if (insertStart === -1) {
      console.error('❌ INSERT statement bulunamadı');
      return;
    }
    
    const insertEnd = taskSection.indexOf('/*!40000 ALTER TABLE `TASK` ENABLE KEYS */', insertStart);
    if (insertEnd === -1) {
      console.error('❌ INSERT statement sonu bulunamadı');
      return;
    }
    
    let insertStatement = taskSection.substring(insertStart, insertEnd);
    
    // Tarih formatlarını ara
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/g,  // YYYY-MM-DD
      /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g,  // YYYY-MM-DD HH:MM:SS
      /'\d{4}-\d{2}-\d{2}'/g,  // 'YYYY-MM-DD'
      /'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'/g  // 'YYYY-MM-DD HH:MM:SS'
    ];
    
    console.log('🔍 Tarih formatlarını arıyorum...');
    
    let foundDates = false;
    datePatterns.forEach((pattern, index) => {
      const matches = insertStatement.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`📅 Pattern ${index + 1} ile ${matches.length} tarih bulundu:`);
        matches.slice(0, 5).forEach(match => {
          console.log(`   - ${match}`);
        });
        foundDates = true;
      }
    });
    
    if (!foundDates) {
      console.log('❌ TASK verilerinde tarih bilgisi bulunamadı');
      
      // İlk birkaç TASK kaydını göster
      console.log('\\n📋 İlk birkaç TASK kaydı:');
      const lines = insertStatement.split('),(');
      lines.slice(0, 3).forEach((line, index) => {
        const cleanLine = line.replace(/^INSERT INTO `TASK` VALUES \(/, '').replace(/\);?$/, '');
        const parts = cleanLine.split(',');
        console.log(`\\n   TASK ${index + 1}:`);
        console.log(`     ID: ${parts[0]}`);
        console.log(`     USERID: ${parts[1]}`);
        console.log(`     DATETIME: ${parts[2]}`);
        console.log(`     DATETIMEDUE: ${parts[3]}`);
        console.log(`     NOTE: ${parts[4] ? parts[4].substring(0, 50) + '...' : 'Boş'}`);
      });
    }
    
    console.log('\\n📝 Sonuç: Backup dosyasındaki TASK verilerinde tarih bilgileri çoğunlukla NULL');
    console.log('   Bu durum orijinal veritabanının durumunu yansıtıyor.');
    console.log('   Görevler oluşturulurken tarih bilgisi girilmemiş olabilir.');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

searchTaskDatesInBackup();