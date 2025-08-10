const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('🔍 EKSİK VERGİ BİLGİLERİNİ BULMA ANALİZİ\n');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    console.log('1. TÜM CONTACT KAYITLARINI ANALİZ EDİYORUM...');
    
    // CONTACT tablosundaki tüm kayıtları al
    const contactInsertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    
    if (contactInsertMatch) {
        const insertData = contactInsertMatch[1];
        const contactRecords = insertData.match(/\([^)]+\)/g);
        
        console.log(`Toplam ${contactRecords.length} contact kaydı bulundu.`);
        
        // Her contact kaydını parse et
        const contacts = [];
        contactRecords.forEach((record, index) => {
            try {
                // Parantezleri kaldır ve virgülle böl
                const cleanRecord = record.slice(1, -1);
                const fields = [];
                let current = '';
                let inQuotes = false;
                let quoteChar = '';
                
                for (let i = 0; i < cleanRecord.length; i++) {
                    const char = cleanRecord[i];
                    
                    if (!inQuotes && (char === "'" || char === '"')) {
                        inQuotes = true;
                        quoteChar = char;
                        current += char;
                    } else if (inQuotes && char === quoteChar) {
                        // Escape karakterini kontrol et
                        if (i > 0 && cleanRecord[i-1] === '\\\\') {
                            current += char;
                        } else {
                            inQuotes = false;
                            current += char;
                        }
                    } else if (!inQuotes && char === ',') {
                        fields.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                if (current.trim()) {
                    fields.push(current.trim());
                }
                
                if (fields.length >= 15) {
                    const contact = {
                        id: fields[0],
                        name: fields[1] ? fields[1].replace(/'/g, '') : '',
                        controlname: fields[2] ? fields[2].replace(/'/g, '') : '',
                        type: fields[3] ? fields[3].replace(/'/g, '') : '',
                        title: fields[4] ? fields[4].replace(/'/g, '') : '',
                        jobtitle: fields[5] ? fields[5].replace(/'/g, '') : '',
                        address: fields[6] ? fields[6].replace(/'/g, '') : '',
                        city: fields[7] ? fields[7].replace(/'/g, '') : '',
                        state: fields[8] ? fields[8].replace(/'/g, '') : '',
                        country: fields[9] ? fields[9].replace(/'/g, '') : '',
                        zip: fields[10] ? fields[10].replace(/'/g, '') : '',
                        parentcontactid: fields[11],
                        parentcontactname: fields[12] ? fields[12].replace(/'/g, '') : '',
                        note: fields[13] ? fields[13].replace(/'/g, '') : '',
                        organizationtypeid: fields[14]
                    };
                    
                    contacts.push(contact);
                }
            } catch (error) {
                console.log(`Kayıt ${index + 1} parse edilemedi:`, error.message);
            }
        });
        
        console.log(`${contacts.length} contact başarıyla parse edildi.`);
        
        // Şirket tipindeki contactları filtrele (type = 'O' olanlar)
        const companies = contacts.filter(c => c.type === 'O');
        console.log(`${companies.length} şirket kaydı bulundu.`);
        
        console.log('\\n2. CONTACTFIELDVALUE\'DAN VERGİ BİLGİLERİNİ TOPLUYORUM...');
        
        // CONTACTFIELDVALUE tablosundan vergi bilgilerini al
        const contactFieldValueMatch = data.match(/INSERT INTO `CONTACTFIELDVALUE` VALUES (.+?);/s);
        const taxInfo = {};
        
        if (contactFieldValueMatch) {
            const insertData = contactFieldValueMatch[1];
            const fieldPattern = /\((\d+),(\d+),(\d+),'([^']*)',/g;
            let match;
            
            while ((match = fieldPattern.exec(insertData)) !== null) {
                const fieldId = parseInt(match[2]);
                const contactId = parseInt(match[3]);
                const value = match[4];
                
                // Vergi bilgisi field'ları (28: Vergi No, 29: Vergi Dairesi)
                if ([28, 29].includes(fieldId) && value && value.trim() !== '') {
                    if (!taxInfo[contactId]) {
                        taxInfo[contactId] = {};
                    }
                    
                    if (fieldId === 28) {
                        taxInfo[contactId].taxNumber = value;
                    } else if (fieldId === 29) {
                        taxInfo[contactId].taxOffice = value;
                    }
                }
            }
        }
        
        console.log(`${Object.keys(taxInfo).length} contact için vergi bilgisi bulundu.`);
        
        console.log('\\n3. NOTE ALANLARINDA VERGİ BİLGİSİ ARIYORUM...');
        
        // NOTE alanlarında vergi bilgisi olan contactları bul
        const noteBasedTaxInfo = {};
        
        companies.forEach(company => {
            const note = company.note.toLowerCase();
            
            // VKN pattern'i ara
            const vknMatch = note.match(/vkn[:\\s]*([0-9]{10})/i);
            if (vknMatch) {
                if (!noteBasedTaxInfo[company.id]) {
                    noteBasedTaxInfo[company.id] = {};
                }
                noteBasedTaxInfo[company.id].taxNumber = vknMatch[1];
            }
            
            // Vergi dairesi pattern'i ara
            const taxOfficeMatch = note.match(/vergi\\s+dairesi[:\\s]*([^\\r\\n]+)/i);
            if (taxOfficeMatch) {
                if (!noteBasedTaxInfo[company.id]) {
                    noteBasedTaxInfo[company.id] = {};
                }
                noteBasedTaxInfo[company.id].taxOffice = taxOfficeMatch[1].trim();
            }
            
            // Vergi no pattern'i ara
            const taxNoMatch = note.match(/vergi\\s+no[:\\s]*([0-9\\s]{8,15})/i);
            if (taxNoMatch && !noteBasedTaxInfo[company.id]?.taxNumber) {
                if (!noteBasedTaxInfo[company.id]) {
                    noteBasedTaxInfo[company.id] = {};
                }
                noteBasedTaxInfo[company.id].taxNumber = taxNoMatch[1].replace(/\\s/g, '');
            }
        });
        
        console.log(`${Object.keys(noteBasedTaxInfo).length} contact için NOTE alanında vergi bilgisi bulundu.`);
        
        console.log('\\n4. TÜM VERGİ BİLGİLERİNİ BİRLEŞTİRİYORUM...');
        
        // Tüm vergi bilgilerini birleştir
        const allTaxInfo = { ...taxInfo };
        
        Object.keys(noteBasedTaxInfo).forEach(contactId => {
            if (!allTaxInfo[contactId]) {
                allTaxInfo[contactId] = {};
            }
            
            if (noteBasedTaxInfo[contactId].taxNumber && !allTaxInfo[contactId].taxNumber) {
                allTaxInfo[contactId].taxNumber = noteBasedTaxInfo[contactId].taxNumber;
            }
            
            if (noteBasedTaxInfo[contactId].taxOffice && !allTaxInfo[contactId].taxOffice) {
                allTaxInfo[contactId].taxOffice = noteBasedTaxInfo[contactId].taxOffice;
            }
        });
        
        console.log(`Toplam ${Object.keys(allTaxInfo).length} contact için vergi bilgisi mevcut.`);
        
        console.log('\\n5. VERGİ BİLGİSİ OLMAYAN ŞİRKETLERİ LİSTELİYORUM...');
        
        const companiesWithoutTax = companies.filter(company => {
            const contactId = parseInt(company.id);
            return !allTaxInfo[contactId] || (!allTaxInfo[contactId].taxNumber && !allTaxInfo[contactId].taxOffice);
        });
        
        console.log(`\\n=== VERGİ BİLGİSİ OLMAYAN ${companiesWithoutTax.length} ŞİRKET ===`);
        
        companiesWithoutTax.slice(0, 50).forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.id} - ${company.name}`);
            if (company.note && company.note.length > 0) {
                const notePreview = company.note.length > 100 ? company.note.substring(0, 100) + '...' : company.note;
                console.log(`   Note: ${notePreview}`);
            }
            console.log('');
        });
        
        if (companiesWithoutTax.length > 50) {
            console.log(`... ve ${companiesWithoutTax.length - 50} şirket daha.`);
        }
        
        console.log('\\n6. VERGİ BİLGİSİ OLAN ŞİRKETLERİ KONTROL EDİYORUM...');
        
        const companiesWithTax = companies.filter(company => {
            const contactId = parseInt(company.id);
            return allTaxInfo[contactId] && (allTaxInfo[contactId].taxNumber || allTaxInfo[contactId].taxOffice);
        });
        
        console.log(`\\n=== VERGİ BİLGİSİ OLAN ${companiesWithTax.length} ŞİRKET (İlk 20) ===`);
        
        companiesWithTax.slice(0, 20).forEach((company, index) => {
            const contactId = parseInt(company.id);
            const tax = allTaxInfo[contactId];
            console.log(`${index + 1}. ID: ${company.id} - ${company.name}`);
            if (tax.taxNumber) console.log(`   Vergi No: ${tax.taxNumber}`);
            if (tax.taxOffice) console.log(`   Vergi Dairesi: ${tax.taxOffice}`);
            console.log('');
        });
        
        console.log('\\n=== ÖZET ===');
        console.log(`Toplam şirket: ${companies.length}`);
        console.log(`Vergi bilgisi olan: ${companiesWithTax.length}`);
        console.log(`Vergi bilgisi olmayan: ${companiesWithoutTax.length}`);
        console.log(`Vergi bilgisi oranı: %${((companiesWithTax.length / companies.length) * 100).toFixed(1)}`);
        
    }
    
} catch (error) {
    console.error('Hata:', error.message);
}