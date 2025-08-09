const fs = require('fs');

// Backup dosyasini oku ve duzelt
const originalBackupFile = '../mydatabase_backup.sql';
let backupContent = fs.readFileSync(originalBackupFile, 'utf8');

console.log('🔍 Orijinal dosya boyutu:', backupContent.length);

// Charset degisiklikleri
backupContent = backupContent
  .replace(/utf8mb3/g, 'utf8mb4')
  .replace(/latin1(?!_)/g, 'utf8mb4')
  .replace(/utf8_general_ci/g, 'utf8mb4_unicode_ci')
  .replace(/latin1_swedish_ci/g, 'utf8mb4_unicode_ci')
  .replace(/DEFAULT CHARSET=latin1/g, 'DEFAULT CHARSET=utf8mb4')
  .replace(/DEFAULT CHARSET=utf8mb3/g, 'DEFAULT CHARSET=utf8mb4')
  .replace(/COLLATE=latin1_swedish_ci/g, 'COLLATE=utf8mb4_unicode_ci')
  .replace(/COLLATE=utf8_general_ci/g, 'COLLATE=utf8mb4_unicode_ci');

// MyISAM'i InnoDB'ye cevir
backupContent = backupContent.replace(/ENGINE=MyISAM/g, 'ENGINE=InnoDB');

// ROW_FORMAT ekle
backupContent = backupContent.replace(
  /(ENGINE=InnoDB[^;]*)(;)/g, 
  '$1 ROW_FORMAT=DYNAMIC$2'
);

// Problematik index'leri kaldir
backupContent = backupContent
  .replace(/,\s*UNIQUE KEY `NAME` \(`NAME`,`ORID`\)/g, '')
  .replace(/,\s*KEY `NAME` \(`NAME`,`ORID`\)/g, '')
  .replace(/,\s*KEY `NAME` \(`NAME`\)/g, '');

console.log('🔍 Duzeltilmis dosya boyutu:', backupContent.length);

// 25. satiri kontrol et
const lines = backupContent.split('\n');
console.log('\n📋 20-30 arasi satirlar:');
for (let i = 19; i < 30; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// CONTACT tablosunu bul
console.log('\n🔍 CONTACT tablosu:');
let inContactTable = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('CREATE TABLE `CONTACT`')) {
    inContactTable = true;
    console.log(`${i+1}: ${line}`);
  } else if (inContactTable) {
    console.log(`${i+1}: ${line}`);
    if (line.includes(') ENGINE=')) {
      break;
    }
  }
}

// Duzeltilmis dosyayi kaydet
fs.writeFileSync('debug_backup_fixed.sql', backupContent);
console.log('\n✅ Duzeltilmis dosya kaydedildi: debug_backup_fixed.sql');