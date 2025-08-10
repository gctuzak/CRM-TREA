const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('🔍 BASİT VERGİ ANALİZİ\n');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    console.log('1. CONTACT TABLOSUNDAN ŞİRKET SAYISINI BULUYORUM...');
    
    // CONTACT tablosundaki şirket kayıtlarını say (type='O' olanlar)
    const contactMatches = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    
    if (contactMatches) {
        const contactData = contactMatches[1];
        
        // Şirket kayıtlarını say (type='O' pattern'i ile)
        const companyPattern = /,'O',/g;
        const companyMatches = contactData.match(companyPattern);
        const totalCompanies = companyMatches ? companyMatches.length : 0;
        
        console.log(`Toplam şirket kaydı: ${totalCompanies}`);
        
        // Tüm contact ID'lerini bul
        const contactIdPattern = /\((\d+),/g;
        const contactIds = [];
        let match;
        
        while ((match = contactIdPattern.exec(contactData)) !== null) {
            contactIds.push(parseInt(match[1]));
        }
        
        console.log(`Toplam contact ID: ${contactIds.length}`);
        console.log(`En küçük ID: ${Math.min(...contactIds)}`);
        console.log(`En büyük ID: ${Math.max(...contactIds)}`);
    }
    
    console.log('\n2. CONTACTFIELDVALUE\'DAN VERGİ BİLGİLERİNİ ANALİZ EDİYORUM...');
    
    // CONTACTFIELDVALUE tablosundan vergi bilgilerini al
    const fieldValueMatches = data.match(/INSERT INTO `CONTACTFIELDVALUE` VALUES (.+?);/s);
    
    if (fieldValueMatches) {
        const fieldData = fieldValueMatches[1];
        
        // Field ID 28 (Vergi No) olan kayıtları bul
        const taxNumberPattern = /\(\d+,28,(\d+),'([^']+)',/g;
        const taxNumbers = {};
        let match;
        
        while ((match = taxNumberPattern.exec(fieldData)) !== null) {
            const contactId = parseInt(match[1]);
            const taxNumber = match[2];
            taxNumbers[contactId] = taxNumber;
        }
        
        console.log(`Field ID 28 (Vergi No) olan ${Object.keys(taxNumbers).length} kayıt:`);
        Object.keys(taxNumbers).slice(0, 10).forEach(contactId => {
            console.log(`  Contact ${contactId}: ${taxNumbers[contactId]}`);
        });
        
        // Field ID 29 (Vergi Dairesi) olan kayıtları bul
        const taxOfficePattern = /\(\d+,29,(\d+),'([^']+)',/g;
        const taxOffices = {};
        
        while ((match = taxOfficePattern.exec(fieldData)) !== null) {
            const contactId = parseInt(match[1]);
            const taxOffice = match[2];
            taxOffices[contactId] = taxOffice;
        }
        
        console.log(`\nField ID 29 (Vergi Dairesi) olan ${Object.keys(taxOffices).length} kayıt:`);
        Object.keys(taxOffices).slice(0, 10).forEach(contactId => {
            console.log(`  Contact ${contactId}: ${taxOffices[contactId]}`);
        });
        
        // Vergi bilgisi olan contact ID'leri
        const taxContactIds = new Set([...Object.keys(taxNumbers), ...Object.keys(taxOffices)]);
        console.log(`\nToplam vergi bilgisi olan contact: ${taxContactIds.size}`);
        
        // Tam vergi bilgisi olan (hem numara hem daire) contact'lar
        const completeTaxInfo = Object.keys(taxNumbers).filter(id => taxOffices[id]);
        console.log(`Tam vergi bilgisi olan contact: ${completeTaxInfo.length}`);
        
        console.log('\n=== TAM VERGİ BİLGİSİ OLAN İLK 10 CONTACT ===');
        completeTaxInfo.slice(0, 10).forEach(contactId => {
            console.log(`Contact ${contactId}:`);
            console.log(`  Vergi No: ${taxNumbers[contactId]}`);
            console.log(`  Vergi Dairesi: ${taxOffices[contactId]}`);
            console.log('');
        });
    }
    
    console.log('\n3. NOTE ALANLARINDA VERGİ BİLGİSİ ARIYORUM...');
    
    // NOTE alanlarında VKN bilgisi olan kayıtları bul
    const vknPattern = /,'([^']*VKN[^']*)',/gi;
    const vknMatches = data.match(vknPattern);
    
    if (vknMatches) {
        console.log(`NOTE alanlarında VKN bilgisi olan ${vknMatches.length} kayıt:`);
        vknMatches.slice(0, 5).forEach((match, index) => {
            console.log(`${index + 1}. ${match}`);
        });
    }
    
    console.log('\n4. 10-11 HANELİ SAYILARI ANALİZ EDİYORUM (VERGİ NUMARASI OLABİLİR)...');
    
    // 10 haneli sayılar (vergi numarası olabilir)
    const tenDigitPattern = /\b\d{10}\b/g;
    const tenDigitNumbers = data.match(tenDigitPattern);
    
    if (tenDigitNumbers) {
        const uniqueTenDigit = [...new Set(tenDigitNumbers)];
        console.log(`10 haneli ${uniqueTenDigit.length} farklı sayı bulundu (ilk 20):`);
        uniqueTenDigit.slice(0, 20).forEach((num, index) => {
            console.log(`${index + 1}. ${num}`);
        });
    }
    
    // 11 haneli sayılar (TC kimlik olabilir)
    const elevenDigitPattern = /\b\d{11}\b/g;
    const elevenDigitNumbers = data.match(elevenDigitPattern);
    
    if (elevenDigitNumbers) {
        const uniqueElevenDigit = [...new Set(elevenDigitNumbers)];
        console.log(`\n11 haneli ${uniqueElevenDigit.length} farklı sayı bulundu (ilk 20):`);
        uniqueElevenDigit.slice(0, 20).forEach((num, index) => {
            console.log(`${index + 1}. ${num}`);
        });
    }
    
    console.log('\n5. CONTACT TABLOSUNDAN ÖRNEK KAYITLARI İNCELİYORUM...');
    
    // CONTACT tablosundan birkaç örnek kayıt al
    const contactInsertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    
    if (contactInsertMatch) {
        const insertData = contactInsertMatch[1];
        
        // İlk birkaç kaydı göster
        const recordPattern = /\([^)]+\)/g;
        const records = insertData.match(recordPattern);
        
        if (records) {
            console.log(`\nToplam ${records.length} CONTACT kaydı bulundu. İlk 3'ü:`);
            records.slice(0, 3).forEach((record, index) => {
                console.log(`\n${index + 1}. ${record.substring(0, 300)}...`);
            });
        }
    }
    
} catch (error) {
    console.error('Hata:', error.message);
}