const XLSX = require('xlsx');

console.log('🔍 EXCEL VERİLERİNİ DEBUG EDİYORUM\n');

try {
    console.log('1. EXCEL DOSYASINI OKUYORUM...');
    
    // Excel dosyasını oku
    const workbook = XLSX.readFile('../kapsamlliliste.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    console.log('\\n=== İLK 20 SATIRIN T, V, W, X SÜTUNLARI ===');
    
    for (let row = 1; row <= Math.min(20, range.e.r); row++) {
        const tCell = worksheet[`T${row + 1}`]; // T sütunu (Kayıt ID)
        const vCell = worksheet[`V${row + 1}`]; // V sütunu (TC Kimlik)
        const wCell = worksheet[`W${row + 1}`]; // W sütunu (Vergi Dairesi)
        const xCell = worksheet[`X${row + 1}`]; // X sütunu (Vergi No)
        
        console.log(`Satır ${row + 1}:`);
        console.log(`  T (Kayıt ID): ${tCell ? tCell.v : '[BOŞ]'}`);
        console.log(`  V (TC Kimlik): ${vCell ? vCell.v : '[BOŞ]'}`);
        console.log(`  W (Vergi Dairesi): ${wCell ? wCell.v : '[BOŞ]'}`);
        console.log(`  X (Vergi No): ${xCell ? xCell.v : '[BOŞ]'}`);
        
        // En az bir vergi bilgisi varsa özellikle işaretle
        if ((vCell && vCell.v) || (wCell && wCell.v) || (xCell && xCell.v)) {
            console.log(`  ⭐ VERGİ BİLGİSİ VAR!`);
        }
        console.log('');
    }
    
    console.log('\\n=== VERGİ BİLGİSİ OLAN SATIRLARI ARAMA ===');
    
    let taxRowsFound = 0;
    const taxRows = [];
    
    for (let row = 1; row <= range.e.r; row++) {
        const tCell = worksheet[`T${row + 1}`]; // T sütunu (Kayıt ID)
        const vCell = worksheet[`V${row + 1}`]; // V sütunu (TC Kimlik)
        const wCell = worksheet[`W${row + 1}`]; // W sütunu (Vergi Dairesi)
        const xCell = worksheet[`X${row + 1}`]; // X sütunu (Vergi No)
        
        // En az bir vergi bilgisi varsa kaydet
        if ((vCell && vCell.v) || (wCell && wCell.v) || (xCell && xCell.v)) {
            taxRowsFound++;
            
            if (taxRows.length < 20) { // İlk 20'sini kaydet
                taxRows.push({
                    row: row + 1,
                    recordId: tCell ? tCell.v : null,
                    tcKimlik: vCell ? vCell.v : null,
                    vergiDairesi: wCell ? wCell.v : null,
                    vergiNo: xCell ? xCell.v : null
                });
            }
        }
    }
    
    console.log(`Toplam ${taxRowsFound} satırda vergi bilgisi bulundu.`);
    
    if (taxRows.length > 0) {
        console.log('\\nİlk 20 vergi bilgisi olan satır:');
        taxRows.forEach((tax, index) => {
            console.log(`${index + 1}. Satır ${tax.row}:`);
            console.log(`   Kayıt ID: ${tax.recordId}`);
            if (tax.tcKimlik) console.log(`   TC Kimlik: ${tax.tcKimlik}`);
            if (tax.vergiDairesi) console.log(`   Vergi Dairesi: ${tax.vergiDairesi}`);
            if (tax.vergiNo) console.log(`   Vergi No: ${tax.vergiNo}`);
            console.log('');
        });
    }
    
    console.log('\\n=== KAYIT ID FORMATLARINI KONTROL EDİYORUM ===');
    
    const recordIdFormats = new Set();
    
    for (let row = 1; row <= Math.min(100, range.e.r); row++) {
        const tCell = worksheet[`T${row + 1}`];
        if (tCell && tCell.v) {
            recordIdFormats.add(tCell.v.toString());
        }
    }
    
    console.log(`İlk 100 satırda ${recordIdFormats.size} farklı Kayıt ID formatı:`);
    Array.from(recordIdFormats).slice(0, 20).forEach((format, index) => {
        console.log(`${index + 1}. ${format}`);
    });
    
} catch (error) {
    console.error('Hata:', error.message);
}