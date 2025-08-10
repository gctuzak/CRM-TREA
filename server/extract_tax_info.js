const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('Vergi bilgilerini çıkarıyorum...');

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
    const taxInfo = {
        vergiNo: [], // FIELDID = 28
        vergiDairesi: [], // FIELDID = 29
        tcKimlik: [] // FIELDID = 30
    };
    
    // Regex ile vergi bilgilerini çıkar
    // Pattern: (ID, FIELDID, CONTACTID, VALUE, ...)
    const fieldValuePattern = /\((\d+),(\d+),(\d+),'([^']*)',/g;
    let match;
    
    while ((match = fieldValuePattern.exec(insertData)) !== null) {
        const id = match[1];
        const fieldId = parseInt(match[2]);
        const contactId = match[3];
        const value = match[4];
        
        if (value && value.trim() !== '') {
            switch (fieldId) {
                case 28: // Vergi No
                    taxInfo.vergiNo.push({
                        id: id,
                        contactId: contactId,
                        value: value
                    });
                    break;
                case 29: // Vergi Dairesi
                    taxInfo.vergiDairesi.push({
                        id: id,
                        contactId: contactId,
                        value: value
                    });
                    break;
                case 30: // TC Kimlik No
                    taxInfo.tcKimlik.push({
                        id: id,
                        contactId: contactId,
                        value: value
                    });
                    break;
            }
        }
    }
    
    console.log(`\n=== VERGİ BİLGİLERİ İSTATİSTİKLERİ ===`);
    console.log(`Vergi Numarası olan kayıt: ${taxInfo.vergiNo.length}`);
    console.log(`Vergi Dairesi olan kayıt: ${taxInfo.vergiDairesi.length}`);
    console.log(`TC Kimlik No olan kayıt: ${taxInfo.tcKimlik.length}`);
    
    // Şimdi CONTACT tablosundan şirket isimlerini al
    const contactMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    if (!contactMatch) {
        console.log('CONTACT tablosu bulunamadı');
        return;
    }
    
    // Contact ID'leri ve isimlerini eşleştir
    const contactNames = {};
    const contactPattern = /\((\d+),'([^']+)','[^']*','([PO])',/g;
    let contactMatchResult;
    
    while ((contactMatchResult = contactPattern.exec(contactMatch[1])) !== null) {
        const contactId = contactMatchResult[1];
        const name = contactMatchResult[2];
        const type = contactMatchResult[3];
        contactNames[contactId] = { name: name, type: type };
    }
    
    // Vergi bilgilerini şirket isimleriyle birleştir
    const companiesWithTaxInfo = [];
    
    // Tüm vergi bilgilerini birleştir
    const allTaxRecords = {};
    
    // Vergi numaralarını ekle
    taxInfo.vergiNo.forEach(record => {
        if (!allTaxRecords[record.contactId]) {
            allTaxRecords[record.contactId] = {};
        }
        allTaxRecords[record.contactId].vergiNo = record.value;
    });
    
    // Vergi dairelerini ekle
    taxInfo.vergiDairesi.forEach(record => {
        if (!allTaxRecords[record.contactId]) {
            allTaxRecords[record.contactId] = {};
        }
        allTaxRecords[record.contactId].vergiDairesi = record.value;
    });
    
    // TC kimlik numaralarını ekle
    taxInfo.tcKimlik.forEach(record => {
        if (!allTaxRecords[record.contactId]) {
            allTaxRecords[record.contactId] = {};
        }
        allTaxRecords[record.contactId].tcKimlik = record.value;
    });
    
    // Şirket bilgileriyle birleştir
    Object.keys(allTaxRecords).forEach(contactId => {
        const contact = contactNames[contactId];
        if (contact) {
            companiesWithTaxInfo.push({
                contactId: contactId,
                name: contact.name,
                type: contact.type,
                vergiNo: allTaxRecords[contactId].vergiNo || '',
                vergiDairesi: allTaxRecords[contactId].vergiDairesi || '',
                tcKimlik: allTaxRecords[contactId].tcKimlik || ''
            });
        }
    });
    
    // Sadece şirketleri filtrele (TYPE = 'O')
    const companiesOnly = companiesWithTaxInfo.filter(c => c.type === 'O');
    
    console.log(`\n=== ŞİRKETLER VERGİ BİLGİLERİ ===`);
    console.log(`Vergi bilgisi olan toplam şirket: ${companiesOnly.length}`);
    
    companiesOnly.forEach((company, index) => {
        console.log(`\\n${index + 1}. ${company.name} (ID: ${company.contactId})`);
        if (company.vergiNo) console.log(`   Vergi No: ${company.vergiNo}`);
        if (company.vergiDairesi) console.log(`   Vergi Dairesi: ${company.vergiDairesi}`);
        if (company.tcKimlik) console.log(`   TC Kimlik: ${company.tcKimlik}`);
        console.log('   ' + '-'.repeat(60));
    });
    
    // JSON dosyasına kaydet
    const outputFile = path.join(__dirname, 'companies_tax_info.json');
    fs.writeFileSync(outputFile, JSON.stringify({
        statistics: {
            totalCompaniesWithTaxInfo: companiesOnly.length,
            vergiNoCount: taxInfo.vergiNo.length,
            vergiDairesiCount: taxInfo.vergiDairesi.length,
            tcKimlikCount: taxInfo.tcKimlik.length
        },
        companies: companiesOnly
    }, null, 2), 'utf8');
    
    console.log(`\\nVergi bilgileri ${outputFile} dosyasına kaydedildi.`);
    
} catch (error) {
    console.error('Hata:', error.message);
}