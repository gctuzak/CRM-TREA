const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Excel dosyasını oku
const excelPath = path.join(__dirname, 'kapsamlliliste.xlsx');

try {
    console.log('Excel dosyası okunuyor...');
    
    // Excel dosyasını oku
    const workbook = XLSX.readFile(excelPath);
    
    // İlk sheet'i al
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // JSON formatına çevir
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('\n=== EXCEL DOSYASI ANALİZİ ===');
    console.log(`Sheet Adı: ${sheetName}`);
    console.log(`Toplam Satır Sayısı: ${jsonData.length}`);
    
    if (jsonData.length > 0) {
        console.log('\n=== SÜTUN BAŞLIKLARI ===');
        const headers = jsonData[0];
        headers.forEach((header, index) => {
            console.log(`${index + 1}. ${header}`);
        });
        
        console.log('\n=== İLK 5 KAYIT ÖRNEĞİ ===');
        for (let i = 1; i <= Math.min(5, jsonData.length - 1); i++) {
            console.log(`\nKayıt ${i}:`);
            const row = jsonData[i];
            headers.forEach((header, index) => {
                if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
                    console.log(`  ${header}: ${row[index]}`);
                }
            });
        }
        
        console.log('\n=== VERİ TİPLERİ ANALİZİ ===');
        const dataTypes = {};
        headers.forEach((header, index) => {
            const sampleValues = [];
            for (let i = 1; i < Math.min(10, jsonData.length); i++) {
                if (jsonData[i][index] !== undefined && jsonData[i][index] !== null && jsonData[i][index] !== '') {
                    sampleValues.push(jsonData[i][index]);
                }
            }
            
            if (sampleValues.length > 0) {
                const firstValue = sampleValues[0];
                let type = 'string';
                
                if (typeof firstValue === 'number') {
                    type = 'number';
                } else if (typeof firstValue === 'string') {
                    // Tarih kontrolü
                    if (firstValue.match(/\d{2}\/\d{2}\/\d{4}/) || firstValue.match(/\d{4}-\d{2}-\d{2}/)) {
                        type = 'date';
                    }
                    // Email kontrolü
                    else if (firstValue.includes('@')) {
                        type = 'email';
                    }
                    // Telefon kontrolü
                    else if (firstValue.match(/[\d\s\-\(\)\+]+/) && firstValue.length > 7) {
                        type = 'phone';
                    }
                }
                
                dataTypes[header] = {
                    type: type,
                    sampleValue: firstValue,
                    totalSamples: sampleValues.length
                };
            }
        });
        
        Object.keys(dataTypes).forEach(header => {
            const info = dataTypes[header];
            console.log(`${header}: ${info.type} (örnek: ${info.sampleValue})`);
        });
        
        console.log('\n=== VERİTABANI TABLO EŞLEŞTİRME ÖNERİLERİ ===');
        
        // Temel contact bilgileri
        const contactFields = ['ad', 'soyad', 'isim', 'name', 'firma', 'company', 'şirket'];
        const emailFields = ['email', 'e-mail', 'eposta', 'mail'];
        const phoneFields = ['telefon', 'phone', 'tel', 'gsm', 'mobile'];
        const addressFields = ['adres', 'address', 'şehir', 'city', 'il'];
        
        console.log('\nContact tablosu için uygun alanlar:');
        headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (contactFields.some(field => lowerHeader.includes(field))) {
                console.log(`  - ${header} -> Contact tablosu`);
            }
        });
        
        console.log('\nContactEmail tablosu için uygun alanlar:');
        headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (emailFields.some(field => lowerHeader.includes(field))) {
                console.log(`  - ${header} -> ContactEmail tablosu`);
            }
        });
        
        console.log('\nContactPhone tablosu için uygun alanlar:');
        headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (phoneFields.some(field => lowerHeader.includes(field))) {
                console.log(`  - ${header} -> ContactPhone tablosu`);
            }
        });
        
        console.log('\nContactField/ContactFieldValue tabloları için uygun alanlar:');
        headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (!contactFields.some(field => lowerHeader.includes(field)) &&
                !emailFields.some(field => lowerHeader.includes(field)) &&
                !phoneFields.some(field => lowerHeader.includes(field))) {
                console.log(`  - ${header} -> Custom Field olarak`);
            }
        });
        
        // JSON dosyasına kaydet
        const outputData = {
            sheetName: sheetName,
            totalRows: jsonData.length,
            headers: headers,
            dataTypes: dataTypes,
            sampleData: jsonData.slice(0, 6), // İlk 5 kayıt + header
            allData: jsonData // Tüm veri
        };
        
        fs.writeFileSync('excel_analysis.json', JSON.stringify(outputData, null, 2), 'utf8');
        console.log('\n=== ANALİZ TAMAMLANDI ===');
        console.log('Detaylı analiz excel_analysis.json dosyasına kaydedildi.');
        
    } else {
        console.log('Excel dosyası boş görünüyor.');
    }
    
} catch (error) {
    console.error('Hata:', error.message);
    
    // XLSX kütüphanesi yoksa yükle
    if (error.message.includes('Cannot find module')) {
        console.log('\nXLSX kütüphanesi yükleniyor...');
        console.log('Lütfen şu komutu çalıştırın: npm install xlsx');
    }
}