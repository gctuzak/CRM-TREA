const fs = require('fs');

function fixBackupFile() {
  console.log('🔧 Orijinal backup dosyası düzeltiliyor...');
  
  const originalFile = '../mydatabase_backup.sql';
  const fixedFile = './mydatabase_backup_final_fixed.sql';
  
  if (!fs.existsSync(originalFile)) {
    console.error(`❌ ${originalFile} dosyası bulunamadı!`);
    return false;
  }

  let content = fs.readFileSync(originalFile, 'utf8');
  
  console.log('  - Charset ayarları düzeltiliyor...');
  // Charset değişiklikleri
  content = content
    .replace(/utf8mb3/g, 'utf8mb4')
    .replace(/latin1(?!_)/g, 'utf8mb4')
    .replace(/utf8_general_ci/g, 'utf8mb4_unicode_ci')
    .replace(/utf8mb3_turkish_ci/g, 'utf8mb4_unicode_ci')
    .replace(/latin1_swedish_ci/g, 'utf8mb4_unicode_ci')
    .replace(/DEFAULT CHARSET=latin1/g, 'DEFAULT CHARSET=utf8mb4')
    .replace(/DEFAULT CHARSET=utf8mb3/g, 'DEFAULT CHARSET=utf8mb4')
    .replace(/COLLATE=latin1_swedish_ci/g, 'COLLATE=utf8mb4_unicode_ci')
    .replace(/COLLATE=utf8_general_ci/g, 'COLLATE=utf8mb4_unicode_ci')
    .replace(/COLLATE=utf8mb3_turkish_ci/g, 'COLLATE=utf8mb4_unicode_ci');

  console.log('  - VARCHAR uzunlukları güvenli hale getiriliyor...');
  // VARCHAR uzunluklarını güvenli hale getir - daha agresif
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

  console.log('  - Problematik UNIQUE KEY\'ler kaldırılıyor...');
  // Problematik UNIQUE KEY'leri tamamen kaldır
  content = content
    .replace(/,\s*UNIQUE KEY `NAME` \(`NAME`,`ORID`\)/g, '')
    .replace(/,\s*KEY `NAME` \(`NAME`,`ORID`\)/g, '')
    .replace(/,\s*KEY `NAME` \(`NAME`\)/g, '')
    .replace(/UNIQUE KEY `NAME` \(`NAME`,`ORID`\),?\s*/g, '')
    .replace(/KEY `NAME` \(`NAME`,`ORID`\),?\s*/g, '')
    .replace(/KEY `NAME` \(`NAME`\),?\s*/g, '');

  console.log('  - Diğer problematik index\'ler düzeltiliyor...');
  // Diğer VARCHAR index'leri için prefix ekle
  content = content
    .replace(/KEY `([^`]+)` \(`([^`]+)`\)/g, (match, keyName, fieldName) => {
      // Sadece VARCHAR alanları için prefix ekle
      if (fieldName.includes('NAME') || fieldName.includes('TITLE') || fieldName.includes('EMAIL')) {
        return `KEY \`${keyName}\` (\`${fieldName}\`(100))`;
      }
      return match;
    });

  console.log('  - MyISAM tabloları InnoDB\'ye çevriliyor...');
  // MyISAM'ı InnoDB'ye çevir
  content = content.replace(/ENGINE=MyISAM/g, 'ENGINE=InnoDB');

  console.log('  - ROW_FORMAT ayarları ekleniyor...');
  // ROW_FORMAT=DYNAMIC ekle
  content = content.replace(
    /(ENGINE=InnoDB[^;]*)(;)/g, 
    '$1 ROW_FORMAT=DYNAMIC$2'
  );

  console.log('  - Çift virgül sorunları düzeltiliyor...');
  // Çift virgül sorunlarını düzelt
  content = content
    .replace(/,,/g, ',')
    .replace(/,\s*\)/g, ')')
    .replace(/,\s*,/g, ',');

  console.log('  - AUTO_INCREMENT sorunları kontrol ediliyor...');
  // AUTO_INCREMENT alanları için PRIMARY KEY kontrolü
  const lines = content.split('\n');
  let inTable = false;
  let autoIncrementField = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('CREATE TABLE')) {
      inTable = true;
      autoIncrementField = '';
    }
    
    if (inTable && line.includes('AUTO_INCREMENT')) {
      const fieldMatch = line.match(/`([^`]+)`.*AUTO_INCREMENT/);
      if (fieldMatch) {
        autoIncrementField = fieldMatch[1];
      }
    }
    
    if (inTable && line.includes(') ENGINE=')) {
      // Tablo sonu, PRIMARY KEY kontrolü yap
      if (autoIncrementField && !content.includes(`PRIMARY KEY (\`${autoIncrementField}\`)`)) {
        // PRIMARY KEY ekle
        lines[i] = line.replace(
          ') ENGINE=',
          `,\n  PRIMARY KEY (\`${autoIncrementField}\`)\n) ENGINE=`
        );
      }
      inTable = false;
    }
  }
  
  content = lines.join('\n');

  console.log('  - Düzeltilmiş dosya kaydediliyor...');
  fs.writeFileSync(fixedFile, content);
  
  console.log(`✅ Düzeltilmiş dosya hazır: ${fixedFile}`);
  return fixedFile;
}

if (require.main === module) {
  fixBackupFile();
}

module.exports = { fixBackupFile };