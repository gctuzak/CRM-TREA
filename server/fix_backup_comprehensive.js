const fs = require('fs');
const path = require('path');

console.log('🔧 Kapsamlı veritabanı yedek düzeltme aracı');

function fixBackupComprehensively() {
    const backupPath = path.join(__dirname, '..', 'mydatabase_backup.sql');
    
    if (!fs.existsSync(backupPath)) {
        console.log('❌ Yedek dosyası bulunamadı:', backupPath);
        return;
    }
    
    console.log('📖 Yedek dosyası okunuyor...');
    let content = fs.readFileSync(backupPath, 'utf8');
    
    console.log('🔧 Tüm sorunlar düzeltiliyor...');
    
    // 1. Charset sorunlarını düzelt
    console.log('  - Charset ayarları düzeltiliyor...');
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
    
    // 2. AUTO_INCREMENT sorunlarını düzelt
    console.log('  - AUTO_INCREMENT sorunları düzeltiliyor...');
    
    // CONTACT tablosu için özel düzeltme
    content = content.replace(
        /CREATE TABLE `CONTACT` \(([\s\S]*?)\) ENGINE=/,
        (match, tableContent) => {
            // AUTO_INCREMENT'i kaldır
            let newContent = tableContent.replace('`ID` int NOT NULL AUTO_INCREMENT,', '`ID` int NOT NULL,');
            
            // Problematik UNIQUE KEY'i kaldır
            newContent = newContent.replace(/,\s*UNIQUE KEY `unique_orid_id`[^,)]+/, '');
            
            return `CREATE TABLE \`CONTACT\` (${newContent}) ENGINE=`;
        }
    );
    
    // 3. Tüm problematik index'leri kaldır ve basit hale getir
    console.log('  - Problematik index\'ler düzeltiliyor...');
    
    // Composite UNIQUE KEY'leri kaldır
    content = content.replace(/,\s*UNIQUE KEY `[^`]+` \(`[^`]+`,`[^`]+`\)/g, '');
    
    // VARCHAR alanları için çok uzun index'leri düzelt
    content = content.replace(
        /KEY `([^`]+)` \(`([^`]+)`\)/g,
        (match, keyName, fieldName) => {
            // VARCHAR(500) gibi uzun alanlar için prefix ekle
            if (content.includes(`\`${fieldName}\` varchar(500)`) || 
                content.includes(`\`${fieldName}\` varchar(250)`)) {
                return `KEY \`${keyName}\` (\`${fieldName}\`(100))`;
            }
            return match;
        }
    );
    
    // 4. AUTO_INCREMENT olan tablolar için PRIMARY KEY ekle
    console.log('  - PRIMARY KEY\'ler düzeltiliyor...');
    
    // Composite PRIMARY KEY'leri düzelt
    content = content.replace(
        /PRIMARY KEY \(`[^`]+`,`ID`\)/g,
        'PRIMARY KEY (`ID`)'
    );
    
    // AUTO_INCREMENT olan ancak PRIMARY KEY olmayan tablolar için PRIMARY KEY ekle
    const tableMatches = content.match(/CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=/g);
    if (tableMatches) {
        tableMatches.forEach(tableMatch => {
            if (tableMatch.includes('AUTO_INCREMENT') && !tableMatch.includes('PRIMARY KEY')) {
                const tableName = tableMatch.match(/CREATE TABLE `([^`]+)`/)[1];
                console.log(`    - ${tableName} tablosuna PRIMARY KEY ekleniyor...`);
                
                const newTableMatch = tableMatch.replace(
                    /(\) ENGINE=)/,
                    ',\n  PRIMARY KEY (`ID`)\n$1'
                );
                content = content.replace(tableMatch, newTableMatch);
            }
        });
    }
    
    // 5. Veri ekleme bölümlerindeki charset sorunlarını düzelt
    console.log('  - Veri charset\'leri düzeltiliyor...');
    content = content.replace(/SET character_set_client = utf8mb3/g, 'SET character_set_client = utf8mb4');
    
    // Yeni dosyayı kaydet
    const fixedPath = path.join(__dirname, 'mydatabase_backup_comprehensive.sql');
    fs.writeFileSync(fixedPath, content);
    
    console.log('✅ Kapsamlı düzeltilmiş yedek dosyası oluşturuldu:', fixedPath);
    console.log('🔄 Test için: node database_restore.js restore mydatabase_backup_comprehensive.sql');
}

fixBackupComprehensively();