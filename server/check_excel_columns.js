const XLSX = require('xlsx');

console.log('🔍 EXCEL SÜTUNLARINI KONTROL EDİYORUM\n');

try {
    console.log('1. EXCEL DOSYASINI OKUYORUM...');
    
    // Excel dosyasını oku
    const workbook = XLSX.readFile('../kapsamlliliste.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`Sheet adı: ${sheetName}`);
    console.log(`Aralık: ${worksheet['!ref']}`);
    
    // İlk satırdaki başlıkları oku
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`\nSütun sayısı: ${range.e.c + 1}`);
    console.log(`Satır sayısı: ${range.e.r + 1}`);
    
    console.log('\n=== TÜM SÜTUN BAŞLIKLARI ===');
    
    for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        const columnLetter = XLSX.utils.encode_col(col);
        
        if (cell && cell.v) {
            console.log(`${columnLetter} (${col + 1}): ${cell.v}`);
            
            // Vergi ile ilgili sütunları özellikle işaretle
            const cellValue = cell.v.toString().toLowerCase();
            if (cellValue.includes('vergi') || cellValue.includes('tc') || cellValue.includes('kimlik') || cellValue.includes('vkn')) {
                console.log(`   ⭐ VERGİ İLE İLGİLİ SÜTUN!`);
            }
        } else {
            console.log(`${columnLetter} (${col + 1}): [BOŞ]`);
        }
    }
    
    console.log('\n=== V, W, X SÜTUNLARINI ÖZEL KONTROL ===');
    
    // V, W, X sütunlarını özellikle kontrol et
    const vCol = 21; // V = 22. sütun (0-indexed: 21)
    const wCol = 22; // W = 23. sütun (0-indexed: 22)  
    const xCol = 23; // X = 24. sütun (0-indexed: 23)
    
    const vHeader = worksheet[XLSX.utils.encode_cell({ r: 0, c: vCol })];
    const wHeader = worksheet[XLSX.utils.encode_cell({ r: 0, c: wCol })];
    const xHeader = worksheet[XLSX.utils.encode_cell({ r: 0, c: xCol })];
    
    console.log(`V sütunu (${vCol + 1}): ${vHeader ? vHeader.v : '[BOŞ]'}`);
    console.log(`W sütunu (${wCol + 1}): ${wHeader ? wHeader.v : '[BOŞ]'}`);
    console.log(`X sütunu (${xCol + 1}): ${xHeader ? xHeader.v : '[BOŞ]'}`);
    
    // İlk birkaç satırdaki değerleri kontrol et
    console.log('\n=== V, W, X SÜTUNLARININ İLK 10 SATIRI ===');
    
    for (let row = 1; row <= Math.min(10, range.e.r); row++) {
        const vCell = worksheet[XLSX.utils.encode_cell({ r: row, c: vCol })];
        const wCell = worksheet[XLSX.utils.encode_cell({ r: row, c: wCol })];
        const xCell = worksheet[XLSX.utils.encode_cell({ r: row, c: xCol })];
        
        console.log(`Satır ${row + 1}:`);
        console.log(`  V: ${vCell ? vCell.v : '[BOŞ]'}`);
        console.log(`  W: ${wCell ? wCell.v : '[BOŞ]'}`);
        console.log(`  X: ${xCell ? xCell.v : '[BOŞ]'}`);
        console.log('');
    }
    
    console.log('\n=== VERGİ İLE İLGİLİ TÜM SÜTUNLARI ARAMA ===');
    
    // Tüm sütunlarda vergi ile ilgili başlıkları ara
    const taxRelatedColumns = [];
    
    for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        const columnLetter = XLSX.utils.encode_col(col);
        
        if (cell && cell.v) {
            const cellValue = cell.v.toString().toLowerCase();
            if (cellValue.includes('vergi') || cellValue.includes('tc') || cellValue.includes('kimlik') || cellValue.includes('vkn') || cellValue.includes('tax')) {
                taxRelatedColumns.push({
                    letter: columnLetter,
                    index: col,
                    header: cell.v
                });
            }
        }
    }
    
    console.log(`Vergi ile ilgili ${taxRelatedColumns.length} sütun bulundu:`);
    taxRelatedColumns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.letter} (${col.index + 1}): ${col.header}`);
        
        // Bu sütunun ilk birkaç değerini göster
        console.log('   İlk 5 değer:');
        for (let row = 1; row <= Math.min(5, range.e.r); row++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col.index })];
            if (cell && cell.v) {
                console.log(`     Satır ${row + 1}: ${cell.v}`);
            }
        }
        console.log('');
    });
    
} catch (error) {
    console.error('Hata:', error.message);
}