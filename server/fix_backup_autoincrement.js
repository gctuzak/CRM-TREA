const fs = require('fs');
const path = require('path');

console.log('🔧 AUTO_INCREMENT ve charset sorunlarını düzelten araç');

function fixAutoIncrementIssues() {
    const backupPath = path.join(__dirname, '..', 'mydatabase_backup.sql');
    
    if (!fs.existsSync(backupPath)) {
        console.log('❌ Yedek dosyası bulunamadı:', backupPath);
        return;
    }
    
    console.log('📖 Yedek dosyası okunuyor...');
    let content = fs.readFileSync(backupPath, 'utf8');
    
    console.log('🔧 AUTO_INCREMENT sorunları düzeltiliyor...');
    
    // AUTO_INCREMENT olan ancak PRIMARY KEY olmayan alanları düzelt
    // CONTACT tablosu için ID alanını düzelt
    content = content.replace(
        /`ID` int NOT NULL AUTO_INCREMENT,[\s\S]*?PRIMARY KEY \(`ORID`,`ID`\)/g,
        (match) => {
            // AUTO_INCREMENT'i kaldır ve PRIMARY KEY'i sadece ID yap
            return match
                .replace('`ID` int NOT NULL AUTO_INCREMENT,', '`ID` int NOT NULL,')
                .replace('PRIMARY KEY (`ORID`,`ID`)', 'PRIMARY KEY (`ID`), UNIQUE KEY `unique_orid_id` (`ORID`,`ID`)');
        }
    );
    
    // Diğer benzer sorunları da düzelt
    content = content.replace(
        /`ID` int NOT NULL AUTO_INCREMENT,[\s\S]*?PRIMARY KEY \([^)]*`ID`[^)]*\)/g,
        (match) => {
            // Eğer PRIMARY KEY composite ise, AUTO_INCREMENT'i kaldır
            if (match.includes('PRIMARY KEY (') && match.match(/PRIMARY KEY \([^)]*,/)) {
                return match.replace('`ID` int NOT NULL AUTO_INCREMENT,', '`ID` int NOT NULL,');
            }
            return match;
        }
    );
    
    console.log('🔧 Charset sorunları düzeltiliyor...');
    
    // Charset değişiklikleri
    content = content
      .replace(/utf8mb3/g, 'utf8mb4')
      .replace(/latin1(?!_)/g, 'utf8mb4')
      .replace(/utf8_general_ci/g, 'utf8mb4_unicode_ci')
      .replace(/latin1_swedish_ci/g, 'utf8mb4_unicode_ci')
      .replace(/utf8mb3_turkish_ci/g, 'utf8mb4_unicode_ci')
      .replace(/DEFAULT CHARSET=latin1/g, 'DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci')
      .replace(/DEFAULT CHARSET=utf8mb3/g, 'DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci')
      .replace(/COLLATE=latin1_swedish_ci/g, 'COLLATE=utf8mb4_unicode_ci')
      .replace(/ENGINE=MyISAM/g, 'ENGINE=InnoDB ROW_FORMAT=DYNAMIC');
    
    console.log('🔧 Index uzunluk sorunları düzeltiliyor...');
    
    // VARCHAR alanları için index prefix'leri düzelt
    content = content.replace(
        /KEY `([^`]+)` \(`([^`]+)`\)/g,
        (match, keyName, fieldName) => {
            // VARCHAR alanları için prefix ekle
            if (content.includes(`\`${fieldName}\` varchar(`)) {
                return `KEY \`${keyName}\` (\`${fieldName}\`(100))`;
            }
            return match;
        }
    );
    
    // UNIQUE KEY'ler için de aynı işlemi yap - sadece VARCHAR alanları için prefix uygula
    content = content.replace(
        /UNIQUE KEY `([^`]+)` \(`([^`]+)`(?:,`([^`]+)`)*\)/g,
        (match, keyName, field1, field2) => {
            if (field2) {
                // Composite key - sadece VARCHAR alanları için prefix uygula
                const field1IsVarchar = content.includes(`\`${field1}\` varchar(`);
                const field2IsVarchar = content.includes(`\`${field2}\` varchar(`);
                
                let newField1 = field1IsVarchar ? `\`${field1}\`(100)` : `\`${field1}\``;
                let newField2 = field2IsVarchar ? `\`${field2}\`(100)` : `\`${field2}\``;
                
                return `UNIQUE KEY \`${keyName}\` (${newField1},${newField2})`;
            } else {
                // Single field key
                if (content.includes(`\`${field1}\` varchar(`)) {
                    return `UNIQUE KEY \`${keyName}\` (\`${field1}\`(100))`;
                }
            }
            return match;
        }
    );
    
    // Yeni dosyayı kaydet
    const fixedPath = path.join(__dirname, 'mydatabase_backup_fixed.sql');
    fs.writeFileSync(fixedPath, content);
    
    console.log('✅ Düzeltilmiş yedek dosyası oluşturuldu:', fixedPath);
    console.log('🔄 Şimdi bu komutu çalıştırın: node database_restore.js restore mydatabase_backup_fixed.sql');
}

fixAutoIncrementIssues();