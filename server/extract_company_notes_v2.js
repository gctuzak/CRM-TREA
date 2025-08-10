const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('Yedek dosyasını okuyorum...');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    // CONTACT tablosundaki INSERT ifadesini bul
    const lines = data.split('\n');
    let insertLine = '';
    
    for (const line of lines) {
        if (line.includes('INSERT INTO `CONTACT` VALUES')) {
            insertLine = line;
            break;
        }
    }
    
    if (!insertLine) {
        console.log('CONTACT INSERT ifadesi bulunamadı');
        return;
    }
    
    console.log('INSERT ifadesi bulundu, parse ediliyor...');
    
    // Regex ile kayıtları çıkar
    const recordPattern = /\(([^)]+)\)/g;
    const records = [];
    let match;
    
    while ((match = recordPattern.exec(insertLine)) !== null) {
        records.push(match[1]);
    }
    
    console.log(`Toplam ${records.length} kayıt bulundu`);
    
    const companies = [];
    
    records.forEach((record, index) => {
        try {
            // Basit split ile değerleri ayır
            const parts = record.split(',');
            
            if (parts.length >= 14) {
                // TYPE alanını kontrol et (5. alan, 0-indexed olarak 4)
                const typeField = parts[4]?.trim().replace(/'/g, '');
                
                if (typeField === 'O') {
                    // NOTE alanını al (14. alan, 0-indexed olarak 13)
                    let noteField = '';
                    if (parts.length > 13) {
                        // NOTE alanı genellikle son kısımlarda, birden fazla virgül içerebilir
                        // Son birkaç alanı birleştir
                        const noteStart = 13;
                        const noteParts = parts.slice(noteStart);
                        noteField = noteParts.join(',').trim().replace(/^'|'$/g, '');
                    }
                    
                    const company = {
                        id: parts[0]?.trim(),
                        name: parts[1]?.trim().replace(/'/g, ''),
                        controlName: parts[2]?.trim().replace(/'/g, ''),
                        type: typeField,
                        note: noteField
                    };
                    
                    // NOTE alanı boş değilse ekle
                    if (company.note && company.note !== 'NULL' && company.note.trim() !== '' && company.note !== 'NULL') {
                        companies.push(company);
                    }
                }
            }
        } catch (error) {
            console.log(`Kayıt ${index + 1} parse edilemedi:`, error.message);
        }
    });
    
    console.log(`\nNOTE alanı olan ${companies.length} şirket bulundu:\n`);
    
    companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
        console.log(`   NOT: ${company.note.substring(0, 200)}${company.note.length > 200 ? '...' : ''}`);
        console.log('   ' + '-'.repeat(80));
    });
    
    // JSON dosyasına kaydet
    const outputFile = path.join(__dirname, 'company_notes_extracted_v2.json');
    fs.writeFileSync(outputFile, JSON.stringify(companies, null, 2), 'utf8');
    console.log(`\nVeriler ${outputFile} dosyasına kaydedildi.`);
    
} catch (error) {
    console.error('Hata:', error.message);
}