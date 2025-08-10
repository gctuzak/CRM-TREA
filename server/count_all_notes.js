const fs = require('fs');
const path = require('path');

// Yedek dosyasını oku
const backupFile = '202507250302_10776';
const backupPath = path.join(__dirname, '..', backupFile);

console.log('Yedek dosyasını okuyorum ve şirket NOTE sayısını hesaplıyorum...');

try {
    const data = fs.readFileSync(backupPath, 'utf8');
    
    // Şirket kayıtlarını (TYPE='O') ve NOTE alanı dolu olanları bul
    // Regex pattern: şirket kaydı + NOTE alanı dolu
    const companyWithNotePattern = /\(\d+,'([^']+)','[^']*','O',NULL,NULL,'[^']*','[^']*','[^']*','[^']*','[^']*',\d+,'[^']*','([^']+)',/g;
    
    const companiesWithNotes = [];
    let match;
    
    while ((match = companyWithNotePattern.exec(data)) !== null) {
        const companyName = match[1];
        const noteField = match[2];
        
        if (noteField && 
            noteField !== 'NULL' && 
            noteField.trim() !== '' && 
            noteField.length > 5) {
            companiesWithNotes.push({
                name: companyName,
                note: noteField
            });
        }
    }
    
    // Ayrıca tüm şirket sayısını da bulalım
    const allCompanyPattern = /\(\d+,'([^']+)','[^']*','O',/g;
    const allCompanies = [];
    let companyMatch;
    
    while ((companyMatch = allCompanyPattern.exec(data)) !== null) {
        allCompanies.push(companyMatch[1]);
    }
    
    console.log(`\n=== SONUÇLAR ===`);
    console.log(`Toplam şirket sayısı: ${allCompanies.length}`);
    console.log(`NOTE alanı olan şirket sayısı: ${companiesWithNotes.length}`);
    console.log(`NOTE alanı olmayan şirket sayısı: ${allCompanies.length - companiesWithNotes.length}`);
    console.log(`NOTE oranı: %${((companiesWithNotes.length / allCompanies.length) * 100).toFixed(1)}`);
    
    console.log(`\n=== NOTE ALANI OLAN ŞİRKETLER (İlk 20) ===`);
    companiesWithNotes.slice(0, 20).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        const notePreview = company.note.length > 100 ? 
            company.note.substring(0, 100) + '...' : 
            company.note;
        console.log(`   NOT: ${notePreview}`);
        console.log('   ' + '-'.repeat(60));
    });
    
    if (companiesWithNotes.length > 20) {
        console.log(`\n... ve ${companiesWithNotes.length - 20} şirket daha.`);
    }
    
    // Sonuçları dosyaya kaydet
    const resultFile = path.join(__dirname, 'note_analysis_summary.json');
    fs.writeFileSync(resultFile, JSON.stringify({
        totalCompanies: allCompanies.length,
        companiesWithNotes: companiesWithNotes.length,
        companiesWithoutNotes: allCompanies.length - companiesWithNotes.length,
        notePercentage: ((companiesWithNotes.length / allCompanies.length) * 100).toFixed(1),
        companiesWithNotesList: companiesWithNotes
    }, null, 2), 'utf8');
    
    console.log(`\nDetaylı sonuçlar ${resultFile} dosyasına kaydedildi.`);
    
} catch (error) {
    console.error('Hata:', error.message);
}