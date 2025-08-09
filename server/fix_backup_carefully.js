const fs = require('fs');

function fixBackupCarefully() {
  console.log('🔄 Backup dosyası dikkatli bir şekilde düzeltiliyor...');
  
  const originalFile = '../mydatabase_backup.sql';
  const fixedFile = './mydatabase_backup_carefully_fixed.sql';
  
  if (!fs.existsSync(originalFile)) {
    console.error(`❌ ${originalFile} dosyası bulunamadı!`);
    return false;
  }

  let content = fs.readFileSync(originalFile, 'utf8');
  
  console.log('  - Charset ayarları düzeltiliyor...');
  // Charset değişiklikleri
  content = content
    .replace(/utf8mb3/g, 'utf8mb4')
    .replace(/utf8mb3_turkish_ci/g, 'utf8mb4_unicode_ci')
    .replace(/latin1(?!_)/g, 'utf8mb4')
    .replace(/utf8_general_ci/g, 'utf8mb4_unicode_ci')
    .replace(/latin1_swedish_ci/g, 'utf8mb4_unicode_ci')
    .replace(/DEFAULT CHARSET=latin1/g, 'DEFAULT CHARSET=utf8mb4')
    .replace(/DEFAULT CHARSET=utf8mb3/g, 'DEFAULT CHARSET=utf8mb4')
    .replace(/COLLATE=latin1_swedish_ci/g, 'COLLATE=utf8mb4_unicode_ci')
    .replace(/COLLATE=utf8_general_ci/g, 'COLLATE=utf8mb4_unicode_ci');

  console.log('  - VARCHAR uzunlukları güvenli hale getiriliyor...');
  // VARCHAR uzunluklarını güvenli hale getir
  content = content
    .replace(/varchar\(500\)/gi, 'varchar(191)')
    .replace(/varchar\(250\)/gi, 'varchar(191)')
    .replace(/varchar\(200\)/gi, 'varchar(150)')
    .replace(/varchar\(150\)/gi, 'varchar(120)')
    .replace(/varchar\(130\)/gi, 'varchar(100)')
    .replace(/varchar\(100\)/gi, 'varchar(80)')
    .replace(/varchar\(70\)/gi, 'varchar(60)')
    .replace(/varchar\(50\)/gi, 'varchar(40)')
    .replace(/VARCHAR\(500\)/g, 'VARCHAR(191)')
    .replace(/VARCHAR\(250\)/g, 'VARCHAR(191)')
    .replace(/VARCHAR\(200\)/g, 'VARCHAR(150)')
    .replace(/VARCHAR\(150\)/g, 'VARCHAR(120)')
    .replace(/VARCHAR\(130\)/g, 'VARCHAR(100)')
    .replace(/VARCHAR\(100\)/g, 'VARCHAR(80)')
    .replace(/VARCHAR\(70\)/g, 'VARCHAR(60)')
    .replace(/VARCHAR\(50\)/g, 'VARCHAR(40)');

  console.log('  - CHAR alanları VARCHAR\'a dönüştürülüyor...');
  // CHAR alanlarını VARCHAR'a dönüştür
  content = content
    .replace(/char\(250\)/gi, 'varchar(191)')
    .replace(/char\(200\)/gi, 'varchar(150)')
    .replace(/char\(150\)/gi, 'varchar(120)')
    .replace(/char\(100\)/gi, 'varchar(80)')
    .replace(/CHAR\(250\)/g, 'VARCHAR(191)')
    .replace(/CHAR\(200\)/g, 'VARCHAR(150)')
    .replace(/CHAR\(150\)/g, 'VARCHAR(120)')
    .replace(/CHAR\(100\)/g, 'VARCHAR(80)');

  console.log('  - MyISAM tabloları InnoDB\'ye çevriliyor...');
  content = content.replace(/ENGINE=MyISAM/g, 'ENGINE=InnoDB');

  console.log('  - ROW_FORMAT ayarları ekleniyor...');
  content = content.replace(
    /(ENGINE=InnoDB[^;]*)(;)/g, 
    '$1 ROW_FORMAT=DYNAMIC$2'
  );

  console.log('  - Problematik KEY\'ler kaldırılıyor (PRIMARY KEY korunuyor)...');
  // PRIMARY KEY hariç tüm KEY'leri kaldır
  content = content
    .replace(/,\s*UNIQUE KEY `[^`]+` \([^)]+\)/g, '')
    .replace(/,\s*KEY `[^`]+` \([^)]+\)/g, '')
    .replace(/UNIQUE KEY `[^`]+` \([^)]+\),?\s*/g, '')
    .replace(/KEY `[^`]+` \([^)]+\),?\s*/g, '');

  console.log('  - PRIMARY KEY sıralaması düzeltiliyor...');
  // AUTO_INCREMENT alanı PRIMARY KEY'de ilk sırada olmalı
  content = content.replace(/PRIMARY KEY \(`ORID`,`ID`\)/g, 'PRIMARY KEY (`ID`,`ORID`)');

  console.log('  - Çift virgül sorunları düzeltiliyor...');
  content = content
    .replace(/,,+/g, ',')
    .replace(/,\s*\)/g, ')')
    .replace(/,\s*,/g, ',');

  console.log('  - Dikkatli dosya kaydediliyor...');
  fs.writeFileSync(fixedFile, content);
  
  console.log(`✅ Dikkatli düzeltilmiş backup dosyası hazır: ${fixedFile}`);
  return fixedFile;
}

if (require.main === module) {
  fixBackupCarefully();
}

module.exports = { fixBackupCarefully };