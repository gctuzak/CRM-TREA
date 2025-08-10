const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('Yedek dosyasını okuyorum ve TÜM şirketlerin NOTE bilgilerini analiz ediyorum...');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    // CONTACT tablosundaki INSERT ifadesini bul
    const insertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+);/s);
    
    if (!insertMatch) {
        console.log('CONTACT INSERT ifadesi bulunamadı');
        return;
    }
    
    const insertData = insertMatch[1];
    console.log('INSERT ifadesi bulundu, tüm kayıtlar parse ediliyor...');
    
    // Tüm kayıtları parse et
    const records = [];
    let currentRecord = '';
    let inQuotes = false;
    let parenCount = 0;
    let escapeNext = false;
    
    for (let i = 0; i < insertData.length; i++) {
        const char = insertData[i];
        const prevChar = insertData[i-1];
        
        if (escapeNext) {
            escapeNext = false;
            if (parenCount > 0) currentRecord += char;
            continue;
        }
        
        if (char === '\\') {
            escapeNext = true;
            if (parenCount > 0) currentRecord += char;
            continue;
        }
        
        if (char === "'" && prevChar !== '\\') {
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
    
    const allCompanies = [];
    const companiesWithNotes = [];
    
    records.forEach((record, index) => {
        try {
            // Basit parsing - virgülle ayrılmış değerler
            const parts = [];
            let currentPart = '';
            let inQuotes = false;
            let escapeNext = false;
            
            for (let i = 0; i < record.length; i++) {
                const char = record[i];
                
                if (escapeNext) {
                    escapeNext = false;
                    currentPart += char;
                    continue;
                }
                
                if (char === '\\') {
                    escapeNext = true;
                    currentPart += char;
                    continue;
                }
                
                if (char === "'" && record[i-1] !== '\\') {
                    inQuotes = !inQuotes;
                    continue;
                }
                
                if (!inQuotes && char === ',') {
                    parts.push(currentPart.trim());
                    currentPart = '';
                } else {
                    currentPart += char;
                }
            }
            parts.push(currentPart.trim()); // Son parçayı ekle
            
            if (parts.length >= 14) {
                const id = parts[0];
                const name = parts[1];
                const type = parts[4];
                const noteField = parts[13] || '';
                
                // Şirket kayıtlarını kontrol et (TYPE = 'O')
                if (type === 'O') {
                    const company = {
                        id: id,
                        name: name,
                        type: type,
                        note: noteField
                    };
                    
                    allCompanies.push(company);
                    
                    // NOTE alanı boş değilse ekle
                    if (noteField && 
                        noteField !== 'NULL' && 
                        noteField !== '' && 
                        noteField.trim() !== '' && 
                        noteField.length > 2) {
                        companiesWithNotes.push(company);
                    }
                }
            }
        } catch (error) {
            console.log(`Kayıt ${index + 1} parse edilemedi:`, error.message);
        }
    });
    
    console.log(`\n=== GENEL İSTATİSTİKLER ===`);
    console.log(`Toplam şirket sayısı: ${allCompanies.length}`);
    console.log(`NOTE alanı olan şirket sayısı: ${companiesWithNotes.length}`);
    console.log(`NOTE alanı olmayan şirket sayısı: ${allCompanies.length - companiesWithNotes.length}`);
    console.log(`NOTE oranı: %${((companiesWithNotes.length / allCompanies.length) * 100).toFixed(1)}`);
    
    console.log(`\n=== NOTE ALANI OLAN ŞİRKETLER ===`);
    companiesWithNotes.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
        const notePreview = company.note.length > 100 ? 
            company.note.substring(0, 100) + '...' : 
            company.note;
        console.log(`   NOT: ${notePreview}`);
        console.log('   ' + '-'.repeat(80));
    });
    
    // Tüm şirketleri JSON dosyasına kaydet
    const allCompaniesFile = path.join(__dirname, 'all_companies_analysis.json');
    fs.writeFileSync(allCompaniesFile, JSON.stringify({
        totalCompanies: allCompanies.length,
        companiesWithNotes: companiesWithNotes.length,
        companiesWithoutNotes: allCompanies.length - companiesWithNotes.length,
        notePercentage: ((companiesWithNotes.length / allCompanies.length) * 100).toFixed(1),
        allCompanies: allCompanies,
        companiesWithNotes: companiesWithNotes
    }, null, 2), 'utf8');
    
    console.log(`\nDetaylı analiz ${allCompaniesFile} dosyasına kaydedildi.`);
    
    // NOTE alanı olan şirketleri ayrı dosyaya kaydet
    const notesFile = path.join(__dirname, 'all_company_notes_complete.json');
    fs.writeFileSync(notesFile, JSON.stringify(companiesWithNotes, null, 2), 'utf8');
    console.log(`NOTE alanı olan şirketler ${notesFile} dosyasına kaydedildi.`);
    
} catch (error) {
    console.error('Hata:', error.message);
}