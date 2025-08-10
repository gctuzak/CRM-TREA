const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('Yedek dosyasını okuyorum...');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    // CONTACT tablosundaki INSERT ifadesini bul
    const contactInsertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+?);/s);
    
    if (!contactInsertMatch) {
        console.log('CONTACT INSERT ifadesi bulunamadı');
        return;
    }
    
    const insertData = contactInsertMatch[1];
    
    // Kayıtları parse et
    const records = [];
    let currentRecord = '';
    let inQuotes = false;
    let parenCount = 0;
    
    for (let i = 0; i < insertData.length; i++) {
        const char = insertData[i];
        
        if (char === "'" && insertData[i-1] !== '\\') {
            inQuotes = !inQuotes;
        }
        
        if (!inQuotes) {
            if (char === '(') {
                parenCount++;
                if (parenCount === 1) {
                    currentRecord = '';
                    continue;
                }
            } else if (char === ')') {
                parenCount--;
                if (parenCount === 0) {
                    records.push(currentRecord);
                    continue;
                }
            }
        }
        
        if (parenCount > 0) {
            currentRecord += char;
        }
    }
    
    console.log(`Toplam ${records.length} kayıt bulundu`);
    
    // Şirket kayıtlarını filtrele ve NOTE alanlarını çıkar
    const companies = [];
    
    records.forEach((record, index) => {
        try {
            // Basit CSV parsing - virgülle ayrılmış değerler
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let i = 0; i < record.length; i++) {
                const char = record[i];
                
                if (char === "'" && record[i-1] !== '\\') {
                    inQuotes = !inQuotes;
                    continue;
                }
                
                if (!inQuotes && char === ',') {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim()); // Son değeri ekle
            
            // Şirket kayıtlarını kontrol et (TYPE = 'O')
            if (values.length >= 14 && values[4] === 'O') {
                const company = {
                    id: values[0],
                    name: values[1],
                    controlName: values[2],
                    type: values[4],
                    address: values[6] || '',
                    city: values[7] || '',
                    state: values[8] || '',
                    zip: values[10] || '',
                    note: values[13] || ''
                };
                
                // NOTE alanı boş değilse ekle
                if (company.note && company.note !== 'NULL' && company.note.trim() !== '') {
                    companies.push(company);
                }
            }
        } catch (error) {
            console.log(`Kayıt ${index + 1} parse edilemedi:`, error.message);
        }
    });
    
    console.log(`\nNOTE alanı olan ${companies.length} şirket bulundu:\n`);
    
    companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
        console.log(`   Adres: ${company.address}, ${company.city}`);
        console.log(`   NOT: ${company.note}`);
        console.log('   ' + '-'.repeat(80));
    });
    
    // JSON dosyasına kaydet
    const outputFile = path.join(__dirname, 'company_notes_extracted.json');
    fs.writeFileSync(outputFile, JSON.stringify(companies, null, 2), 'utf8');
    console.log(`\nVeriler ${outputFile} dosyasına kaydedildi.`);
    
} catch (error) {
    console.error('Hata:', error.message);
}