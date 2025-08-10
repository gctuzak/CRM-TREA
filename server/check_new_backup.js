const fs = require('fs');
const path = require('path');

// Yeni yedek dosyasını oku
const backupFile = '202508010300_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('🔍 YENİ YEDEK DOSYASI KONTROLÜ\n');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    console.log('1. DOSYA BOYUTU VE GENEL BİLGİLER:');
    console.log(`Dosya boyutu: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Toplam karakter sayısı: ${data.length.toLocaleString()}`);
    
    console.log('\n2. CONTACT TABLOSU ANALİZ:');
    
    // CONTACT tablosundaki kayıt sayısını kontrol et
    const contactInsertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    
    if (contactInsertMatch) {
        const insertData = contactInsertMatch[1];
        console.log(`CONTACT INSERT veri uzunluğu: ${(insertData.length / 1024).toFixed(2)} KB`);
        
        // Kayıt sayısını say
        const recordPattern = /\([^)]+\)/g;
        const records = insertData.match(recordPattern);
        console.log(`CONTACT kayıt sayısı: ${records ? records.length : 0}`);
        
        if (records && records.length > 0) {
            console.log('İlk 5 CONTACT kaydı:');
            records.slice(0, 5).forEach((record, index) => {
                console.log(`${index + 1}. ${record.substring(0, 150)}...`);
            });
        }
        
        // Şirket kayıtlarını say (type='O' olanlar)
        const companyPattern = /,'O',/g;
        const companyMatches = insertData.match(companyPattern);
        console.log(`Şirket kaydı sayısı (type='O'): ${companyMatches ? companyMatches.length : 0}`);
        
    } else {
        console.log('❌ CONTACT INSERT verisi bulunamadı!');
    }
    
    console.log('\n3. CONTACTFIELDVALUE ANALİZ:');
    
    const fieldValueMatch = data.match(/INSERT INTO `CONTACTFIELDVALUE` VALUES (.+?);/s);
    
    if (fieldValueMatch) {
        const insertData = fieldValueMatch[1];
        console.log(`CONTACTFIELDVALUE INSERT veri uzunluğu: ${(insertData.length / 1024).toFixed(2)} KB`);
        
        // Unique contact ID'leri bul
        const contactIdPattern = /\(\d+,\d+,(\d+),/g;
        const contactIds = new Set();
        let match;
        
        while ((match = contactIdPattern.exec(insertData)) !== null) {
            contactIds.add(parseInt(match[1]));
        }
        
        console.log(`CONTACTFIELDVALUE'da unique contact ID sayısı: ${contactIds.size}`);
        
        // Vergi bilgisi olan contact'ları say
        const taxNumberPattern = /\(\d+,28,(\d+),'([^']+)',/g;
        const taxNumbers = {};
        
        while ((match = taxNumberPattern.exec(insertData)) !== null) {
            const contactId = parseInt(match[1]);
            const taxNumber = match[2];
            taxNumbers[contactId] = taxNumber;
        }
        
        console.log(`Vergi numarası olan contact sayısı: ${Object.keys(taxNumbers).length}`);
        
        const taxOfficePattern = /\(\d+,29,(\d+),'([^']+)',/g;
        const taxOffices = {};
        
        while ((match = taxOfficePattern.exec(insertData)) !== null) {
            const contactId = parseInt(match[1]);
            const taxOffice = match[2];
            taxOffices[contactId] = taxOffice;
        }
        
        console.log(`Vergi dairesi olan contact sayısı: ${Object.keys(taxOffices).length}`);
        
        // Tam vergi bilgisi olan contact'lar
        const completeTaxInfo = Object.keys(taxNumbers).filter(id => taxOffices[id]);
        console.log(`Tam vergi bilgisi olan contact sayısı: ${completeTaxInfo.length}`);
        
        console.log('\nTam vergi bilgisi olan ilk 10 contact:');
        completeTaxInfo.slice(0, 10).forEach(contactId => {
            console.log(`Contact ${contactId}: ${taxNumbers[contactId]} - ${taxOffices[contactId]}`);
        });
    }
    
    console.log('\n4. NOTE ALANLARINDA VERGİ BİLGİSİ:');
    
    // NOTE alanlarında VKN bilgisi olan kayıtları bul
    const vknPattern = /,'([^']*VKN[^']*)',/gi;
    const vknMatches = data.match(vknPattern);
    
    if (vknMatches) {
        console.log(`NOTE alanlarında VKN bilgisi olan ${vknMatches.length} kayıt bulundu.`);
        
        // VKN'leri çıkar
        const vknNumbers = [];
        vknMatches.forEach(match => {
            const vknMatch = match.match(/VKN[:\\s]*([0-9]{10})/i);
            if (vknMatch) {
                vknNumbers.push(vknMatch[1]);
            }
        });
        
        console.log(`NOTE'lardan çıkarılan VKN sayısı: ${vknNumbers.length}`);
        console.log('NOTE\'lardan çıkarılan VKN\'ler:');
        vknNumbers.forEach((vkn, index) => {
            console.log(`${index + 1}. ${vkn}`);
        });
    }
    
    console.log('\n5. TOPLAM VERGİ BİLGİSİ DURUMU:');
    
    // Tüm vergi bilgilerini topla
    const fieldValueMatch2 = data.match(/INSERT INTO `CONTACTFIELDVALUE` VALUES (.+?);/s);
    
    if (fieldValueMatch2) {
        const insertData = fieldValueMatch2[1];
        
        // Field 28 (Vergi No) kayıtları
        const taxNumberPattern = /\(\d+,28,(\d+),'([^']+)',/g;
        const fieldTaxNumbers = {};
        let match;
        
        while ((match = taxNumberPattern.exec(insertData)) !== null) {
            const contactId = parseInt(match[1]);
            const taxNumber = match[2];
            fieldTaxNumbers[contactId] = taxNumber;
        }
        
        // Field 29 (Vergi Dairesi) kayıtları
        const taxOfficePattern = /\(\d+,29,(\d+),'([^']+)',/g;
        const fieldTaxOffices = {};
        
        while ((match = taxOfficePattern.exec(insertData)) !== null) {
            const contactId = parseInt(match[1]);
            const taxOffice = match[2];
            fieldTaxOffices[contactId] = taxOffice;
        }
        
        // NOTE'lardan VKN bilgisi olan contact'ları bul
        const contactInsertMatch2 = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
        const noteBasedTax = {};
        
        if (contactInsertMatch2) {
            const contactData = contactInsertMatch2[1];
            const contactRecords = contactData.match(/\([^)]+\)/g);
            
            if (contactRecords) {
                contactRecords.forEach(record => {
                    // Contact ID'yi çıkar
                    const idMatch = record.match(/^\((\d+),/);
                    if (idMatch) {
                        const contactId = parseInt(idMatch[1]);
                        
                        // NOTE alanında VKN var mı kontrol et
                        const vknMatch = record.match(/VKN[:\\s]*([0-9]{10})/i);
                        if (vknMatch) {
                            noteBasedTax[contactId] = vknMatch[1];
                        }
                    }
                });
            }
        }
        
        console.log(`Field 28'den vergi numarası: ${Object.keys(fieldTaxNumbers).length} contact`);
        console.log(`Field 29'dan vergi dairesi: ${Object.keys(fieldTaxOffices).length} contact`);
        console.log(`NOTE'lardan VKN: ${Object.keys(noteBasedTax).length} contact`);
        
        // Toplam unique vergi bilgisi olan contact'lar
        const allTaxContactIds = new Set([
            ...Object.keys(fieldTaxNumbers),
            ...Object.keys(fieldTaxOffices),
            ...Object.keys(noteBasedTax)
        ]);
        
        console.log(`TOPLAM vergi bilgisi olan contact: ${allTaxContactIds.size}`);
    }
    
} catch (error) {
    console.error('Hata:', error.message);
}