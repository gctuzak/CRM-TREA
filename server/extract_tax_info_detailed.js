const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('Vergi bilgilerini detaylı analiz ediyorum...');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    // CONTACTFIELDVALUE tablosundaki INSERT ifadesini bul
    const contactFieldValueMatch = data.match(/INSERT INTO `CONTACTFIELDVALUE` VALUES (.+?);/s);
    
    if (!contactFieldValueMatch) {
        console.log('CONTACTFIELDVALUE INSERT ifadesi bulunamadı');
        return;
    }
    
    const insertData = contactFieldValueMatch[1];
    console.log('CONTACTFIELDVALUE verileri bulundu, parse ediliyor...');
    
    // Vergi bilgilerini topla
    const taxRecords = [];
    
    // Regex ile vergi bilgilerini çıkar - daha esnek pattern
    const recordPattern = /\((\d+),(\d+),(\d+),'([^']*)',([^,]+),([^,]+),([^,]+),'([^']*)'\)/g;
    let match;
    
    while ((match = recordPattern.exec(insertData)) !== null) {
        const id = match[1];
        const fieldId = parseInt(match[2]);
        const contactId = match[3];
        const value = match[4];
        
        // Sadece vergi ile ilgili field'ları al
        if ([28, 29, 30].includes(fieldId) && value && value.trim() !== '') {
            taxRecords.push({
                id: id,
                fieldId: fieldId,
                contactId: contactId,
                value: value,
                fieldName: fieldId === 28 ? 'Vergi No' : fieldId === 29 ? 'Vergi Dairesi' : 'TC Kimlik'
            });
        }
    }
    
    console.log(`Toplam ${taxRecords.length} vergi bilgisi kaydı bulundu`);
    
    // İlk 10 kaydı göster
    console.log('\\n=== İLK 10 VERGİ KAYDI ===');
    taxRecords.slice(0, 10).forEach((record, index) => {
        console.log(`${index + 1}. Contact ID: ${record.contactId}, ${record.fieldName}: ${record.value}`);
    });
    
    // CONTACT tablosundan şirket isimlerini al
    const contactMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    if (!contactMatch) {
        console.log('CONTACT tablosu bulunamadı');
        return;
    }
    
    console.log('\\nCONTACT tablosunu parse ediyorum...');
    
    // Contact bilgilerini topla
    const contacts = {};
    const contactData = contactMatch[1];
    
    // Daha basit regex ile contact bilgilerini al
    const contactPattern = /\((\d+),'([^']+)','[^']*','([PO])',/g;
    let contactMatchResult;
    
    while ((contactMatchResult = contactPattern.exec(contactData)) !== null) {
        const contactId = contactMatchResult[1];
        const name = contactMatchResult[2];
        const type = contactMatchResult[3];
        contacts[contactId] = { name: name, type: type };
    }
    
    console.log(`Toplam ${Object.keys(contacts).length} contact kaydı bulundu`);
    
    // Vergi bilgilerini contact'larla eşleştir
    const companiesWithTax = {};
    
    taxRecords.forEach(record => {
        const contact = contacts[record.contactId];
        if (contact && contact.type === 'O') { // Sadece şirketler
            if (!companiesWithTax[record.contactId]) {
                companiesWithTax[record.contactId] = {
                    contactId: record.contactId,
                    name: contact.name,
                    type: contact.type,
                    vergiNo: '',
                    vergiDairesi: '',
                    tcKimlik: ''
                };
            }
            
            if (record.fieldId === 28) {
                companiesWithTax[record.contactId].vergiNo = record.value;
            } else if (record.fieldId === 29) {
                companiesWithTax[record.contactId].vergiDairesi = record.value;
            } else if (record.fieldId === 30) {
                companiesWithTax[record.contactId].tcKimlik = record.value;
            }
        }
    });
    
    const companiesList = Object.values(companiesWithTax);
    
    console.log(`\\n=== VERGİ BİLGİSİ OLAN ŞİRKETLER (${companiesList.length} adet) ===`);
    
    companiesList.forEach((company, index) => {
        console.log(`\\n${index + 1}. ${company.name} (ID: ${company.contactId})`);
        if (company.vergiNo) console.log(`   Vergi No: ${company.vergiNo}`);
        if (company.vergiDairesi) console.log(`   Vergi Dairesi: ${company.vergiDairesi}`);
        if (company.tcKimlik) console.log(`   TC Kimlik: ${company.tcKimlik}`);
        console.log('   ' + '-'.repeat(60));
    });
    
    // JSON dosyasına kaydet
    const outputFile = path.join(__dirname, 'companies_tax_info_detailed.json');
    fs.writeFileSync(outputFile, JSON.stringify({
        statistics: {
            totalTaxRecords: taxRecords.length,
            totalContacts: Object.keys(contacts).length,
            companiesWithTaxInfo: companiesList.length
        },
        companies: companiesList,
        rawTaxRecords: taxRecords.slice(0, 20) // İlk 20 kayıt
    }, null, 2), 'utf8');
    
    console.log(`\\nDetaylı vergi bilgileri ${outputFile} dosyasına kaydedildi.`);
    
} catch (error) {
    console.error('Hata:', error.message);
}