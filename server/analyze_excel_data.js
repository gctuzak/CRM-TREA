const XLSX = require('xlsx');
const { sequelize } = require('./config/database');

console.log('📊 EXCEL DOSYASI ANALİZİ VE VERİTABANI KARŞILAŞTIRMASI\n');

async function analyzeExcelData() {
    try {
        console.log('1. EXCEL DOSYASINI OKUYORUM...');
        
        // Excel dosyasını oku
        const workbook = XLSX.readFile('../kapsamlliliste.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON formatına çevir
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`✅ Excel dosyası başarıyla okundu: ${excelData.length} kayıt bulundu`);
        
        // İlk birkaç kaydı göster
        console.log('\n=== EXCEL VERİSİ ÖRNEKLERİ ===');
        excelData.slice(0, 5).forEach((row, index) => {
            console.log(`${index + 1}. Kayıt:`);
            Object.keys(row).forEach(key => {
                console.log(`   ${key}: ${row[key]}`);
            });
            console.log('');
        });
        
        // Excel sütunlarını analiz et
        const columns = Object.keys(excelData[0] || {});
        console.log(`\n=== EXCEL SÜTUNLARI (${columns.length} adet) ===`);
        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col}`);
        });
        
        console.log('\n2. VERİTABANI BAĞLANTISI KURULUYOR...');
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.');
        
        console.log('\n3. MEVCUT VERİTABANI VERİLERİNİ ALIYORUM...');
        
        // Mevcut contact verilerini al
        const [dbContacts] = await sequelize.query(`
            SELECT 
                c.ID,
                c.NAME,
                c.TYPE,
                c.TITLE,
                c.JOBTITLE,
                c.ADDRESS,
                c.CITY,
                c.STATE,
                c.COUNTRY,
                c.ZIP,
                c.NOTE,
                c.ORGANIZATIONTYPEID,
                GROUP_CONCAT(CASE WHEN cfv.FIELDID = 28 THEN cfv.VALUE END) as TAX_NUMBER,
                GROUP_CONCAT(CASE WHEN cfv.FIELDID = 29 THEN cfv.VALUE END) as TAX_OFFICE
            FROM CONTACT c
            LEFT JOIN CONTACTFIELDVALUE cfv ON c.ID = cfv.CONTACTID
            WHERE c.TYPE = 'O'
            GROUP BY c.ID, c.NAME, c.TYPE, c.TITLE, c.JOBTITLE, c.ADDRESS, c.CITY, c.STATE, c.COUNTRY, c.ZIP, c.NOTE, c.ORGANIZATIONTYPEID
            ORDER BY c.ID
        `);
        
        console.log(`✅ Veritabanından ${dbContacts.length} şirket kaydı alındı`);
        
        console.log('\n4. EXCEL VE VERİTABANI VERİLERİNİ KARŞILAŞTIRIYORUM...');
        
        // Excel verilerini şirket ismine göre indeksle
        const excelByName = {};
        const excelByTaxNumber = {};
        
        excelData.forEach(row => {
            // Şirket ismi sütununu bul (farklı isimler olabilir)
            const nameColumns = columns.filter(col => 
                col.toLowerCase().includes('name') || 
                col.toLowerCase().includes('isim') || 
                col.toLowerCase().includes('şirket') ||
                col.toLowerCase().includes('firma')
            );
            
            const taxColumns = columns.filter(col =>
                col.toLowerCase().includes('vergi') ||
                col.toLowerCase().includes('vkn') ||
                col.toLowerCase().includes('tax')
            );
            
            if (nameColumns.length > 0) {
                const companyName = row[nameColumns[0]];
                if (companyName) {
                    excelByName[companyName.toString().trim().toUpperCase()] = row;
                }
            }
            
            if (taxColumns.length > 0) {
                const taxNumber = row[taxColumns[0]];
                if (taxNumber) {
                    excelByTaxNumber[taxNumber.toString().trim()] = row;
                }
            }
        });
        
        console.log(`Excel verisi indekslendi: ${Object.keys(excelByName).length} isim, ${Object.keys(excelByTaxNumber).length} vergi numarası`);
        
        console.log('\n5. EKSİK VE HATALI VERİLERİ TESPİT EDİYORUM...');
        
        const missingInDb = [];
        const foundMatches = [];
        const taxMismatches = [];
        const missingTaxInfo = [];
        
        // Excel'deki her kayıt için veritabanında karşılık ara
        excelData.forEach((excelRow, index) => {
            const nameColumns = columns.filter(col => 
                col.toLowerCase().includes('name') || 
                col.toLowerCase().includes('isim') || 
                col.toLowerCase().includes('şirket') ||
                col.toLowerCase().includes('firma')
            );
            
            if (nameColumns.length > 0) {
                const excelName = excelRow[nameColumns[0]];
                if (excelName) {
                    const normalizedExcelName = excelName.toString().trim().toUpperCase();
                    
                    // Veritabanında bu isimle eşleşen kayıt var mı?
                    const dbMatch = dbContacts.find(db => 
                        db.NAME.toUpperCase().includes(normalizedExcelName) ||
                        normalizedExcelName.includes(db.NAME.toUpperCase())
                    );
                    
                    if (dbMatch) {
                        foundMatches.push({
                            excel: excelRow,
                            db: dbMatch,
                            excelIndex: index
                        });
                        
                        // Vergi bilgilerini karşılaştır
                        const taxColumns = columns.filter(col =>
                            col.toLowerCase().includes('vergi') ||
                            col.toLowerCase().includes('vkn') ||
                            col.toLowerCase().includes('tax')
                        );
                        
                        if (taxColumns.length > 0) {
                            const excelTaxNumber = excelRow[taxColumns[0]];
                            const dbTaxNumber = dbMatch.TAX_NUMBER;
                            
                            if (excelTaxNumber && !dbTaxNumber) {
                                missingTaxInfo.push({
                                    contactId: dbMatch.ID,
                                    name: dbMatch.NAME,
                                    excelTaxNumber: excelTaxNumber.toString().trim(),
                                    excel: excelRow
                                });
                            } else if (excelTaxNumber && dbTaxNumber && 
                                      excelTaxNumber.toString().trim() !== dbTaxNumber.toString().trim()) {
                                taxMismatches.push({
                                    contactId: dbMatch.ID,
                                    name: dbMatch.NAME,
                                    excelTaxNumber: excelTaxNumber.toString().trim(),
                                    dbTaxNumber: dbTaxNumber.toString().trim(),
                                    excel: excelRow
                                });
                            }
                        }
                    } else {
                        missingInDb.push({
                            name: normalizedExcelName,
                            excel: excelRow,
                            excelIndex: index
                        });
                    }
                }
            }
        });
        
        console.log(`\n=== KARŞILAŞTIRMA SONUÇLARI ===`);
        console.log(`✅ Eşleşen kayıt: ${foundMatches.length}`);
        console.log(`❌ Veritabanında eksik: ${missingInDb.length}`);
        console.log(`⚠️  Vergi numarası eksik: ${missingTaxInfo.length}`);
        console.log(`🔄 Vergi numarası farklı: ${taxMismatches.length}`);
        
        // Detayları göster
        if (missingInDb.length > 0) {
            console.log(`\n=== VERİTABANINDA EKSİK KAYITLAR (İlk 10) ===`);
            missingInDb.slice(0, 10).forEach((missing, index) => {
                console.log(`${index + 1}. ${missing.name}`);
                console.log(`   Excel satır: ${missing.excelIndex + 2}`);
            });
        }
        
        if (missingTaxInfo.length > 0) {
            console.log(`\n=== VERGİ BİLGİSİ EKSİK KAYITLAR (İlk 10) ===`);
            missingTaxInfo.slice(0, 10).forEach((missing, index) => {
                console.log(`${index + 1}. ${missing.name} (ID: ${missing.contactId})`);
                console.log(`   Excel'deki vergi no: ${missing.excelTaxNumber}`);
            });
        }
        
        if (taxMismatches.length > 0) {
            console.log(`\n=== VERGİ NUMARASI FARKLI KAYITLAR (İlk 10) ===`);
            taxMismatches.slice(0, 10).forEach((mismatch, index) => {
                console.log(`${index + 1}. ${mismatch.name} (ID: ${mismatch.contactId})`);
                console.log(`   Excel: ${mismatch.excelTaxNumber}`);
                console.log(`   DB: ${mismatch.dbTaxNumber}`);
            });
        }
        
        // Sonuçları dosyaya kaydet
        const results = {
            totalExcelRecords: excelData.length,
            totalDbRecords: dbContacts.length,
            foundMatches: foundMatches.length,
            missingInDb: missingInDb,
            missingTaxInfo: missingTaxInfo,
            taxMismatches: taxMismatches,
            excelColumns: columns
        };
        
        require('fs').writeFileSync('excel_comparison_results.json', JSON.stringify(results, null, 2));
        console.log(`\n✅ Karşılaştırma sonuçları 'excel_comparison_results.json' dosyasına kaydedildi`);
        
        return results;
        
    } catch (error) {
        console.error('Hata:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

analyzeExcelData();