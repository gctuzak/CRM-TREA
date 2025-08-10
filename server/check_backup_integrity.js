const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('🔍 YEDEK DOSYASI BÜTÜNLÜK KONTROLÜ\n');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    console.log('1. DOSYA BOYUTU VE GENEL BİLGİLER:');
    console.log(`Dosya boyutu: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Toplam karakter sayısı: ${data.length.toLocaleString()}`);
    
    console.log('\n2. TABLO YAPILARINI KONTROL EDİYORUM:');
    
    // Her tablo için CREATE TABLE ve INSERT INTO sayılarını kontrol et
    const tables = ['CONTACT', 'CONTACTFIELDVALUE', 'CONTACTFIELD', 'CONTACTEMAIL', 'CONTACTPHONE'];
    
    tables.forEach(tableName => {
        console.log(`\n--- ${tableName} TABLOSU ---`);
        
        // CREATE TABLE kontrolü
        const createPattern = new RegExp(`CREATE TABLE \`${tableName}\``, 'g');
        const createMatches = data.match(createPattern);
        console.log(`CREATE TABLE: ${createMatches ? createMatches.length : 0} adet`);
        
        // INSERT INTO kontrolü
        const insertPattern = new RegExp(`INSERT INTO \`${tableName}\` VALUES`, 'g');
        const insertMatches = data.match(insertPattern);
        console.log(`INSERT INTO: ${insertMatches ? insertMatches.length : 0} adet`);
        
        // INSERT verilerinin boyutunu kontrol et
        const insertDataMatch = data.match(new RegExp(`INSERT INTO \`${tableName}\` VALUES (.+?);`, 's'));
        if (insertDataMatch) {
            const insertData = insertDataMatch[1];
            console.log(`INSERT veri boyutu: ${(insertData.length / 1024).toFixed(2)} KB`);
            
            // Kayıt sayısını tahmin et (parantez çiftleri)
            const recordPattern = /\([^)]+\)/g;
            const records = insertData.match(recordPattern);
            console.log(`Tahmini kayıt sayısı: ${records ? records.length : 0}`);
        } else {
            console.log('INSERT verisi bulunamadı!');
        }
    });
    
    console.log('\n3. CONTACT TABLOSU DETAYLI ANALİZ:');
    
    // CONTACT tablosunun tam INSERT verisini kontrol et
    const contactInsertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    
    if (contactInsertMatch) {
        const insertData = contactInsertMatch[1];
        console.log(`CONTACT INSERT veri uzunluğu: ${insertData.length} karakter`);
        
        // Veriyi satırlara böl
        const lines = insertData.split('\n');
        console.log(`CONTACT INSERT satır sayısı: ${lines.length}`);
        
        // İlk ve son satırları göster
        console.log(`İlk satır: ${lines[0].substring(0, 200)}...`);
        if (lines.length > 1) {
            console.log(`Son satır: ${lines[lines.length - 1].substring(0, 200)}...`);
        }
        
        // Parantez çiftlerini say
        const parenMatches = insertData.match(/\([^)]*\)/g);
        console.log(`Parantez çifti sayısı: ${parenMatches ? parenMatches.length : 0}`);
        
        // Virgül sayısını kontrol et
        const commaCount = (insertData.match(/,/g) || []).length;
        console.log(`Virgül sayısı: ${commaCount}`);
        
    } else {
        console.log('CONTACT INSERT verisi bulunamadı!');
    }
    
    console.log('\n4. CONTACTFIELDVALUE TABLOSU ANALİZ:');
    
    const fieldValueMatch = data.match(/INSERT INTO `CONTACTFIELDVALUE` VALUES (.+?);/s);
    
    if (fieldValueMatch) {
        const insertData = fieldValueMatch[1];
        console.log(`CONTACTFIELDVALUE INSERT veri uzunluğu: ${insertData.length} karakter`);
        
        // Unique contact ID'leri bul
        const contactIdPattern = /\(\d+,\d+,(\d+),/g;
        const contactIds = new Set();
        let match;
        
        while ((match = contactIdPattern.exec(insertData)) !== null) {
            contactIds.add(parseInt(match[1]));
        }
        
        console.log(`CONTACTFIELDVALUE'da unique contact ID sayısı: ${contactIds.size}`);
        console.log(`En küçük contact ID: ${Math.min(...contactIds)}`);
        console.log(`En büyük contact ID: ${Math.max(...contactIds)}`);
        
        // İlk 10 contact ID'yi göster
        const sortedIds = Array.from(contactIds).sort((a, b) => a - b);
        console.log(`İlk 10 contact ID: ${sortedIds.slice(0, 10).join(', ')}`);
        console.log(`Son 10 contact ID: ${sortedIds.slice(-10).join(', ')}`);
    }
    
    console.log('\n5. YEDEK DOSYASININ BÜTÜNLÜĞÜNÜ KONTROL EDİYORUM:');
    
    // Dosyanın sonunda eksik veri var mı kontrol et
    const lastLines = data.split('\n').slice(-10);
    console.log('Son 10 satır:');
    lastLines.forEach((line, index) => {
        console.log(`${index + 1}. ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    });
    
    // Dosya düzgün bitmiş mi kontrol et
    if (data.endsWith(';')) {
        console.log('\n✅ Dosya düzgün bir şekilde ; ile bitiyor.');
    } else {
        console.log('\n❌ Dosya düzgün bitmiyor, eksik veri olabilir!');
    }
    
    console.log('\n6. CONTACT TABLOSUNDA EKSİK VERİ VAR MI?');
    
    // CONTACT tablosunun tam yapısını kontrol et
    const contactCreateMatch = data.match(/CREATE TABLE `CONTACT` \((.+?)\) ENGINE=/s);
    if (contactCreateMatch) {
        const tableStructure = contactCreateMatch[1];
        console.log('CONTACT tablo yapısı bulundu.');
        
        // CONTACT INSERT'inin tam olup olmadığını kontrol et
        const fullContactInsert = data.match(/INSERT INTO `CONTACT` VALUES[^;]*;/s);
        if (fullContactInsert) {
            console.log(`Tam CONTACT INSERT uzunluğu: ${fullContactInsert[0].length} karakter`);
        } else {
            console.log('❌ Tam CONTACT INSERT bulunamadı!');
        }
    }
    
} catch (error) {
    console.error('Hata:', error.message);
}