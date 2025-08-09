const fs = require('fs');
const path = require('path');

console.log('🔧 Agresif veritabanı yedek düzeltme aracı');

function fixBackupAggressively() {
    const backupPath = path.join(__dirname, '..', 'mydatabase_backup.sql');
    
    if (!fs.existsSync(backupPath)) {
        console.log('❌ Yedek dosyası bulunamadı:', backupPath);
        return;
    }
    
    console.log('📖 Yedek dosyası okunuyor...');
    let content = fs.readFileSync(backupPath, 'utf8');
    
    console.log('🔧 Agresif düzeltmeler uygulanıyor...');
    
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
    
    // 2. Tüm problematik index'leri kaldır
    console.log('  - Tüm problematik index\'ler kaldırılıyor...');
    
    // UNIQUE KEY'leri kaldır (sadece PRIMARY KEY kalsın)
    content = content.replace(/,\s*UNIQUE KEY `[^`]+`[^,)]+/g, '');
    
    // Uzun VARCHAR alanları için KEY'leri kaldır
    content = content.replace(/,\s*KEY `[^`]+` \(`[^`]+`\([0-9]+\)\)/g, '');
    
    // Diğer KEY'leri de kaldır (performans için gerekirse sonra ekleriz)
    content = content.replace(/,\s*KEY `[^`]+` \(`[^`]+`\)/g, '');
    
    // 3. AUTO_INCREMENT sorunlarını düzelt
    console.log('  - AUTO_INCREMENT sorunları düzeltiliyor...');
    
    // Tüm tablolar için AUTO_INCREMENT olan alanları PRIMARY KEY yap
    const lines = content.split('\n');
    let inTable = false;
    let tableName = '';
    let hasAutoIncrement = false;
    let hasPrimaryKey = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('CREATE TABLE')) {
            inTable = true;
            tableName = line.match(/CREATE TABLE `([^`]+)`/)?.[1] || '';
            hasAutoIncrement = false;
            hasPrimaryKey = false;
        }
        
        if (inTable && line.includes('AUTO_INCREMENT')) {
            hasAutoIncrement = true;
        }
        
        if (inTable && line.includes('PRIMARY KEY')) {
            hasPrimaryKey = true;
        }
        
        if (inTable && line.includes(') ENGINE=')) {
            // Tablo sonu
            if (hasAutoIncrement && !hasPrimaryKey) {
                console.log(`    - ${tableName} tablosuna PRIMARY KEY ekleniyor...`);
                lines[i] = line.replace(
                    ') ENGINE=',
                    ',\n  PRIMARY KEY (`ID`)\n) ENGINE='
                );
            }
            inTable = false;
        }
    }
    
    content = lines.join('\n');
    
    // 4. Composite PRIMARY KEY'leri düzelt
    console.log('  - Composite PRIMARY KEY\'ler düzeltiliyor...');
    content = content.replace(
        /PRIMARY KEY \(`[^`]+`,`ID`\)/g,
        'PRIMARY KEY (`ID`)'
    );
    
    // Malformed PRIMARY KEY'leri düzelt
    content = content.replace(
        /PRIMARY KEY \(`ID`\),`[^`]+`\)/g,
        'PRIMARY KEY (`ID`)'
    );
    
    // 5. Veri ekleme bölümlerindeki charset sorunlarını düzelt
    console.log('  - Veri charset\'leri düzeltiliyor...');
    content = content.replace(/SET character_set_client = utf8mb3/g, 'SET character_set_client = utf8mb4');
    
    // Yeni dosyayı kaydet
    const fixedPath = path.join(__dirname, 'mydatabase_backup_aggressive.sql');
    fs.writeFileSync(fixedPath, content);
    
    console.log('✅ Agresif düzeltilmiş yedek dosyası oluşturuldu:', fixedPath);
    console.log('🔄 Test için: node database_restore.js restore mydatabase_backup_aggressive.sql');
}

fixBackupAggressively();