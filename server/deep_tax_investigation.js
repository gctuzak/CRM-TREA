const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('🔍 DERINLEMESINE VERGİ BİLGİSİ ARAŞTIRMASI BAŞLIYOR...\n');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    console.log('1. CONTACTFIELD tablosunu analiz ediyorum - hangi field ID\'ler ne anlama geliyor?');
    
    // CONTACTFIELD tablosundaki field tanımlarını bul
    const contactFieldMatch = data.match(/INSERT INTO `CONTACTFIELD` VALUES (.+?);/s);
    
    if (contactFieldMatch) {
        const insertData = contactFieldMatch[1];
        const fieldPattern = /\((\d+),'([^']*)',(\d+),(\d+),'([^']*)','([^']*)'/g;
        let match;
        const fieldDefinitions = {};
        
        console.log('\n=== CONTACTFIELD TABLO YAPISI ===');
        while ((match = fieldPattern.exec(insertData)) !== null) {
            const fieldId = match[1];
            const fieldName = match[2];
            const fieldType = match[3];
            const isRequired = match[4];
            const label = match[5];
            const placeholder = match[6];
            
            fieldDefinitions[fieldId] = {
                name: fieldName,
                type: fieldType,
                required: isRequired,
                label: label,
                placeholder: placeholder
            };
            
            // Vergi ile ilgili field'ları özellikle göster
            if (fieldName.toLowerCase().includes('vergi') || 
                fieldName.toLowerCase().includes('tax') || 
                fieldName.toLowerCase().includes('vkn') ||
                fieldName.toLowerCase().includes('kimlik') ||
                label.toLowerCase().includes('vergi') ||
                label.toLowerCase().includes('tax') ||
                label.toLowerCase().includes('vkn') ||
                label.toLowerCase().includes('kimlik')) {
                console.log(`🏷️  Field ID ${fieldId}: ${fieldName} (${label}) - Type: ${fieldType}, Required: ${isRequired}`);
            }
        }
        
        console.log(`\nToplam ${Object.keys(fieldDefinitions).length} field tanımı bulundu.`);
    }
    
    console.log('\n2. TÜM FIELD ID\'LERDE VERGİ BİLGİSİ ARIYORUM...');
    
    // CONTACTFIELDVALUE tablosundaki TÜM field'ları kontrol et
    const contactFieldValueMatch = data.match(/INSERT INTO `CONTACTFIELDVALUE` VALUES (.+?);/s);
    
    if (contactFieldValueMatch) {
        const insertData = contactFieldValueMatch[1];
        const allFieldPattern = /\((\d+),(\d+),(\d+),'([^']*)',/g;
        let match;
        const allFieldData = {};
        
        while ((match = allFieldPattern.exec(insertData)) !== null) {
            const id = match[1];
            const fieldId = parseInt(match[2]);
            const contactId = match[3];
            const value = match[4];
            
            if (!allFieldData[fieldId]) {
                allFieldData[fieldId] = [];
            }
            
            // Sadece dolu değerleri kaydet
            if (value && value.trim() !== '') {
                allFieldData[fieldId].push({
                    id: id,
                    contactId: contactId,
                    value: value
                });
            }
        }
        
        console.log('\n=== TÜM FIELD ID\'LERDE DOLU VERİLER ===');
        Object.keys(allFieldData)
            .sort((a, b) => allFieldData[b].length - allFieldData[a].length)
            .forEach(fieldId => {
                const count = allFieldData[fieldId].length;
                console.log(`Field ID ${fieldId}: ${count} dolu kayıt`);
                
                // İlk 3 örneği göster
                if (count > 0) {
                    allFieldData[fieldId].slice(0, 3).forEach((record, index) => {
                        const preview = record.value.length > 50 ? record.value.substring(0, 50) + '...' : record.value;
                        console.log(`  ${index + 1}. Contact ${record.contactId}: "${preview}"`);
                    });
                }
                console.log('');
            });
    }
    
    console.log('\n3. SAYISAL PATTERN ANALİZİ - VERGİ NUMARASI OLABİLECEK TÜM SAYILAR...');
    
    // Farklı uzunluklarda sayısal pattern'ler ara
    const patterns = {
        '10_haneli': /\b\d{10}\b/g,
        '11_haneli': /\b\d{11}\b/g,
        '8_haneli': /\b\d{8}\b/g,
        '9_haneli': /\b\d{9}\b/g
    };
    
    Object.keys(patterns).forEach(patternName => {
        const matches = data.match(patterns[patternName]);
        if (matches) {
            const uniqueMatches = [...new Set(matches)];
            console.log(`\n${patternName.replace('_', ' ').toUpperCase()} SAYILAR (${uniqueMatches.length} farklı):`);
            uniqueMatches.slice(0, 15).forEach((num, index) => {
                console.log(`${index + 1}. ${num}`);
            });
        }
    });
    
    console.log('\n4. CONTACT TABLOSUNDA GİZLİ VERGİ ALANLARI VAR MI?');
    
    // CONTACT tablosunun INSERT verilerini analiz et
    const contactInsertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    
    if (contactInsertMatch) {
        const insertData = contactInsertMatch[1];
        
        // CONTACT tablosunun yapısını öğren
        const contactCreateMatch = data.match(/CREATE TABLE `CONTACT` \((.+?)\) ENGINE=/s);
        if (contactCreateMatch) {
            const tableStructure = contactCreateMatch[1];
            const columns = tableStructure.split(',').map(col => col.trim().split(' ')[0].replace('`', ''));
            
            console.log('\nCONTACT tablosu sütunları:');
            columns.forEach((col, index) => {
                console.log(`${index + 1}. ${col}`);
            });
            
            // İlk birkaç CONTACT kaydını analiz et
            const contactRecords = insertData.match(/\([^)]+\)/g);
            if (contactRecords) {
                console.log(`\n${contactRecords.length} CONTACT kaydı bulundu. İlk 5'ini analiz ediyorum:`);
                
                contactRecords.slice(0, 5).forEach((record, index) => {
                    console.log(`\nKayıt ${index + 1}: ${record.substring(0, 200)}...`);
                });
            }
        }
    }
    
    console.log('\n5. NOTE VE AÇIKLAMA ALANLARINDA VERGİ BİLGİSİ TARAMASI...');
    
    // Tüm note, description, comment alanlarında vergi bilgisi ara
    const taxKeywords = ['vergi', 'vkn', 'tax', 'kimlik', 'tc', 'daire'];
    const notePatterns = taxKeywords.map(keyword => new RegExp(`'[^']*${keyword}[^']*'`, 'gi'));
    
    notePatterns.forEach((pattern, index) => {
        const matches = data.match(pattern);
        if (matches) {
            console.log(`\n"${taxKeywords[index]}" kelimesi içeren ${matches.length} kayıt:`);
            matches.slice(0, 10).forEach((match, i) => {
                console.log(`${i + 1}. ${match}`);
            });
        }
    });
    
    console.log('\n6. FARKLI TABLOLARDA VERGİ BİLGİSİ ARAMA...');
    
    // Diğer tablolarda vergi bilgisi olabilir
    const tableNames = ['LEAD', 'OPPORTUNITY', 'TASK', 'EVENT'];
    
    tableNames.forEach(tableName => {
        console.log(`\n${tableName} tablosunu kontrol ediyorum...`);
        
        const tableInsertRegex = new RegExp(`INSERT INTO \`${tableName}\` VALUES (.+?);`, 's');
        const tableMatch = data.match(tableInsertRegex);
        
        if (tableMatch) {
            const tableData = tableMatch[1];
            
            // Bu tabloda vergi ile ilgili bilgi var mı?
            taxKeywords.forEach(keyword => {
                const keywordRegex = new RegExp(keyword, 'gi');
                const keywordMatches = tableData.match(keywordRegex);
                if (keywordMatches) {
                    console.log(`  ${tableName} tablosunda "${keyword}" kelimesi ${keywordMatches.length} kez geçiyor`);
                }
            });
        }
    });
    
} catch (error) {
    console.error('Hata:', error.message);
}