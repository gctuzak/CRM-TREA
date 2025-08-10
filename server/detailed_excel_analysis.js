const XLSX = require('xlsx');
const { sequelize } = require('./config/database');

console.log('🔍 DETAYLI EXCEL ANALİZİ VE KAYIT ID EŞLEŞTİRMESİ\n');

async function detailedExcelAnalysis() {
    try {
        console.log('1. EXCEL DOSYASINI DETAYLI OKUYORUM...');
        
        // Excel dosyasını oku
        const workbook = XLSX.readFile('../kapsamlliliste.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON formatına çevir
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`✅ Excel dosyası başarıyla okundu: ${excelData.length} kayıt bulundu`);
        
        // Kayıt ID'lerini analiz et
        console.log('\n=== KAYIT ID ANALİZİ ===');
        const recordIds = [];
        const recordIdPattern = /O(\d+)/;
        
        excelData.forEach((row, index) => {
            const recordId = row['Kayıt ID'];
            if (recordId) {
                const match = recordId.match(recordIdPattern);
                if (match) {
                    const numericId = parseInt(match[1]);
                    recordIds.push({
                        excelIndex: index,
                        recordId: recordId,
                        numericId: numericId,
                        name: row['Müşteri Adı'],
                        row: row
                    });
                }
            }
        });
        
        console.log(`${recordIds.length} kayıt ID'si çıkarıldı`);
        console.log(`En küçük ID: ${Math.min(...recordIds.map(r => r.numericId))}`);
        console.log(`En büyük ID: ${Math.max(...recordIds.map(r => r.numericId))}`);
        
        // İlk 10 kayıt ID'sini göster
        console.log('\\nİlk 10 kayıt ID:');
        recordIds.slice(0, 10).forEach((record, index) => {
            console.log(`${index + 1}. ${record.recordId} (${record.numericId}) - ${record.name}`);
        });
        
        console.log('\\n2. VERİTABANI BAĞLANTISI KURULUYOR...');
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.');
        
        console.log('\\n3. VERİTABANI KAYITLARINI ALIYORUM...');
        
        // Veritabanındaki tüm şirket kayıtlarını al
        const [dbContacts] = await sequelize.query(`
            SELECT 
                c.ID,
                c.NAME,
                c.ADDRESS,
                c.CITY,
                c.STATE,
                c.NOTE,
                (SELECT cfv.VALUE FROM CONTACTFIELDVALUE cfv WHERE cfv.CONTACTID = c.ID AND cfv.FIELDID = 28 LIMIT 1) as TAX_NUMBER,
                (SELECT cfv.VALUE FROM CONTACTFIELDVALUE cfv WHERE cfv.CONTACTID = c.ID AND cfv.FIELDID = 29 LIMIT 1) as TAX_OFFICE
            FROM CONTACT c
            WHERE c.TYPE = 'O'
            ORDER BY c.ID
        `);
        
        console.log(`✅ Veritabanından ${dbContacts.length} şirket kaydı alındı`);
        
        console.log('\\n4. KAYIT ID\'LERİNE GÖRE EŞLEŞTİRME YAPIYORUM...');
        
        const matches = [];
        const missingInDb = [];
        const extraInDb = [];
        
        // Excel'deki her kayıt için veritabanında karşılık ara
        recordIds.forEach(excelRecord => {
            const dbMatch = dbContacts.find(db => db.ID === excelRecord.numericId);
            
            if (dbMatch) {
                matches.push({
                    id: excelRecord.numericId,
                    excel: excelRecord,
                    db: dbMatch
                });
            } else {
                missingInDb.push(excelRecord);
            }
        });
        
        // Veritabanında olup Excel'de olmayan kayıtları bul
        const excelIds = new Set(recordIds.map(r => r.numericId));
        dbContacts.forEach(dbRecord => {
            if (!excelIds.has(dbRecord.ID)) {
                extraInDb.push(dbRecord);
            }
        });
        
        console.log(`\\n=== EŞLEŞTİRME SONUÇLARI ===`);
        console.log(`✅ Eşleşen kayıt: ${matches.length}`);
        console.log(`❌ Excel'de var, DB'de yok: ${missingInDb.length}`);
        console.log(`➕ DB'de var, Excel'de yok: ${extraInDb.length}`);
        
        console.log('\\n5. EKSİK KAYITLARI ANALİZ EDİYORUM...');
        
        if (missingInDb.length > 0) {
            console.log(`\\n=== EXCEL'DE VAR DB'DE YOK (İlk 20) ===`);
            missingInDb.slice(0, 20).forEach((missing, index) => {
                console.log(`${index + 1}. ID: ${missing.numericId} - ${missing.name}`);
                console.log(`   Adres: ${missing.row['Adres'] || 'Yok'}`);
                console.log(`   İl: ${missing.row['İl'] || 'Yok'}`);
                console.log('');
            });
        }
        
        if (extraInDb.length > 0) {
            console.log(`\\n=== DB'DE VAR EXCEL'DE YOK (İlk 20) ===`);
            extraInDb.slice(0, 20).forEach((extra, index) => {
                console.log(`${index + 1}. ID: ${extra.ID} - ${extra.NAME}`);
                console.log(`   Adres: ${extra.ADDRESS || 'Yok'}`);
                console.log(`   Şehir: ${extra.CITY || 'Yok'}`);
                if (extra.TAX_NUMBER) console.log(`   Vergi No: ${extra.TAX_NUMBER}`);
                console.log('');
            });
        }
        
        console.log('\\n6. VERGİ BİLGİSİ KARŞILAŞTIRMASI...');
        
        // Excel'de vergi bilgisi var mı kontrol et
        const excelColumns = Object.keys(excelData[0] || {});
        const taxColumns = excelColumns.filter(col =>
            col.toLowerCase().includes('vergi') ||
            col.toLowerCase().includes('vkn') ||
            col.toLowerCase().includes('tax')
        );
        
        console.log(`Excel'de vergi ile ilgili sütunlar: ${taxColumns.length > 0 ? taxColumns.join(', ') : 'Bulunamadı'}`);
        
        // Eşleşen kayıtlarda vergi bilgisi karşılaştırması
        const taxComparison = {
            bothHave: 0,
            onlyDbHas: 0,
            onlyExcelHas: 0,
            neitherHas: 0,
            different: []
        };
        
        matches.forEach(match => {
            const dbHasTax = match.db.TAX_NUMBER && match.db.TAX_NUMBER.trim() !== '';
            const excelHasTax = false; // Excel'de vergi sütunu yok gibi görünüyor
            
            if (dbHasTax && excelHasTax) {
                taxComparison.bothHave++;
            } else if (dbHasTax && !excelHasTax) {
                taxComparison.onlyDbHas++;
            } else if (!dbHasTax && excelHasTax) {
                taxComparison.onlyExcelHas++;
            } else {
                taxComparison.neitherHas++;
            }
        });
        
        console.log(`\\n=== VERGİ BİLGİSİ KARŞILAŞTIRMASI ===`);
        console.log(`Her ikisinde de var: ${taxComparison.bothHave}`);
        console.log(`Sadece DB'de var: ${taxComparison.onlyDbHas}`);
        console.log(`Sadece Excel'de var: ${taxComparison.onlyExcelHas}`);
        console.log(`Hiçbirinde yok: ${taxComparison.neitherHas}`);
        
        console.log('\\n7. İSİM KARŞILAŞTIRMASI...');
        
        // İsim farklılıklarını kontrol et
        const nameDifferences = [];
        matches.forEach(match => {
            const excelName = match.excel.name.trim().toUpperCase();
            const dbName = match.db.NAME.trim().toUpperCase();
            
            if (excelName !== dbName) {
                nameDifferences.push({
                    id: match.id,
                    excelName: match.excel.name,
                    dbName: match.db.NAME
                });
            }
        });
        
        console.log(`İsmi farklı olan kayıt sayısı: ${nameDifferences.length}`);
        
        if (nameDifferences.length > 0) {
            console.log(`\\nİsim farklılıkları (İlk 10):`);
            nameDifferences.slice(0, 10).forEach((diff, index) => {
                console.log(`${index + 1}. ID: ${diff.id}`);
                console.log(`   Excel: ${diff.excelName}`);
                console.log(`   DB: ${diff.dbName}`);
                console.log('');
            });
        }
        
        // Sonuçları kaydet
        const results = {
            totalExcelRecords: excelData.length,
            totalDbRecords: dbContacts.length,
            extractedRecordIds: recordIds.length,
            matches: matches.length,
            missingInDb: missingInDb.length,
            extraInDb: extraInDb.length,
            nameDifferences: nameDifferences.length,
            taxComparison: taxComparison,
            excelColumns: excelColumns,
            taxColumns: taxColumns,
            missingInDbList: missingInDb.slice(0, 50),
            extraInDbList: extraInDb.slice(0, 50),
            nameDifferencesList: nameDifferences.slice(0, 50)
        };
        
        require('fs').writeFileSync('detailed_comparison_results.json', JSON.stringify(results, null, 2));
        console.log(`\\n✅ Detaylı karşılaştırma sonuçları 'detailed_comparison_results.json' dosyasına kaydedildi`);
        
        return results;
        
    } catch (error) {
        console.error('Hata:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

detailedExcelAnalysis();