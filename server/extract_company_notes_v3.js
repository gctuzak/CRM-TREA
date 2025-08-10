const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('Yedek dosyasını okuyorum...');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    // CONTACT tablosundaki INSERT ifadesini bul
    const insertMatch = data.match(/INSERT INTO `CONTACT` VALUES (.+);/s);
    
    if (!insertMatch) {
        console.log('CONTACT INSERT ifadesi bulunamadı');
        return;
    }
    
    const insertData = insertMatch[1];
    console.log('INSERT ifadesi bulundu, parse ediliyor...');
    
    // Manuel olarak bilinen şirketleri arayalım
    const knownCompanies = [
        'ACIBADEM PROJE YÖNETİMİ',
        'GÜNEŞTEN YAPIM YONETIM TASARIM',
        'AŞÇIOĞLU İŞ ORTAKLIĞI'
    ];
    
    const companies = [];
    
    // Her şirket için arama yap
    knownCompanies.forEach(companyName => {
        const regex = new RegExp(`\\(\\d+,'${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^)]+\\)`, 'g');
        let match;
        
        while ((match = regex.exec(insertData)) !== null) {
            const record = match[0];
            console.log(`\n${companyName} için kayıt bulundu:`);
            console.log(record.substring(0, 500) + '...');
            
            // Bu kaydı parse et
            try {
                const values = record.slice(1, -1).split(',');
                
                if (values.length >= 14 && values[4]?.includes("'O'")) {
                    // NOTE alanını bul (genellikle 13. index civarında)
                    let noteField = '';
                    for (let i = 13; i < values.length; i++) {
                        if (values[i] && values[i].includes("'") && values[i].length > 5) {
                            noteField = values[i].replace(/^'|'$/g, '');
                            break;
                        }
                    }
                    
                    if (noteField && noteField !== 'NULL' && noteField.trim() !== '') {
                        companies.push({
                            id: values[0],
                            name: values[1]?.replace(/'/g, ''),
                            note: noteField
                        });
                    }
                }
            } catch (error) {
                console.log('Parse hatası:', error.message);
            }
        }
    });
    
    // Ayrıca genel arama da yapalım
    console.log('\n\nGenel arama yapılıyor...');
    
    // Şirket kayıtlarını (TYPE='O') ve NOTE alanı dolu olanları bul
    const companyPattern = /\(\d+,'([^']+)','[^']*','O',NULL,NULL,'[^']*','[^']*','[^']*','[^']*','[^']*',\d+,'[^']*','([^']+)',/g;
    let match;
    
    while ((match = companyPattern.exec(insertData)) !== null) {
        const companyName = match[1];
        const noteField = match[2];
        
        if (noteField && noteField !== 'NULL' && noteField.trim() !== '' && noteField.length > 5) {
            console.log(`\nŞirket bulundu: ${companyName}`);
            console.log(`NOT: ${noteField.substring(0, 200)}...`);
            
            companies.push({
                name: companyName,
                note: noteField
            });
        }
    }
    
    console.log(`\n\nToplam ${companies.length} şirket NOTE bilgisi bulundu.`);
    
    // JSON dosyasına kaydet
    const outputFile = path.join(__dirname, 'company_notes_extracted_v3.json');
    fs.writeFileSync(outputFile, JSON.stringify(companies, null, 2), 'utf8');
    console.log(`Veriler ${outputFile} dosyasına kaydedildi.`);
    
} catch (error) {
    console.error('Hata:', error.message);
}