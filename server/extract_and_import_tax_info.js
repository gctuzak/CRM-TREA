const { sequelize } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function extractAndImportTaxInfo() {
    try {
        // Yedek dosyasını oku
        const backupFile = '202507250302_10776';
        const backupPath = path.join(__dirname, '..', backupFile);
        
        console.log('Vergi bilgilerini çıkarıyorum ve veritabanına aktarıyorum...');
        
        const data = fs.readFileSync(backupPath, 'utf8');
        
        // CONTACTFIELDVALUE tablosundaki vergi bilgilerini bul
        const taxPattern = /\((\d+),(2[89]),(\d+),'([^']+)',/g;
        const taxRecords = [];
        let match;
        
        while ((match = taxPattern.exec(data)) !== null) {
            const id = match[1];
            const fieldId = parseInt(match[2]);
            const contactId = match[3];
            const value = match[4];
            
            if (value && value.trim() !== '') {
                taxRecords.push({
                    id: id,
                    fieldId: fieldId,
                    contactId: contactId,
                    value: value,
                    fieldName: fieldId === 28 ? 'Vergi No' : 'Vergi Dairesi'
                });
            }
        }
        
        console.log(`${taxRecords.length} vergi bilgisi kaydı bulundu`);
        
        // Veritabanına bağlan
        await sequelize.authenticate();
        console.log('Veritabanına bağlanıldı.');
        
        // Contact ID'leri ile şirket isimlerini al
        const contactIds = [...new Set(taxRecords.map(r => r.contactId))];
        console.log(`${contactIds.length} farklı contact için vergi bilgisi var`);
        
        const companiesWithTax = {};
        
        // Her contact ID için şirket bilgisini al
        for (const contactId of contactIds) {
            try {
                const [rows] = await sequelize.query(
                    'SELECT ID as id, NAME as name, TYPE as type FROM CONTACT WHERE ID = ? AND TYPE = ?',
                    {
                        replacements: [contactId, 'O'],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                
                if (rows) {
                    companiesWithTax[contactId] = {
                        id: rows.id,
                        name: rows.name,
                        type: rows.type,
                        vergiNo: '',
                        vergiDairesi: ''
                    };
                }
            } catch (error) {
                console.log(`Contact ID ${contactId} sorgulanırken hata:`, error.message);
            }
        }
        
        // Vergi bilgilerini şirketlerle eşleştir
        taxRecords.forEach(record => {
            if (companiesWithTax[record.contactId]) {
                if (record.fieldId === 28) {
                    companiesWithTax[record.contactId].vergiNo = record.value;
                } else if (record.fieldId === 29) {
                    companiesWithTax[record.contactId].vergiDairesi = record.value;
                }
            }
        });
        
        const companiesList = Object.values(companiesWithTax).filter(c => c.vergiNo || c.vergiDairesi);
        
        console.log(`\\n=== VERGİ BİLGİSİ OLAN ŞİRKETLER (${companiesList.length} adet) ===`);
        
        let updatedCount = 0;
        
        for (const company of companiesList) {
            try {
                // Mevcut CONTACTFIELDVALUE kayıtlarını kontrol et
                const [existingTaxNo] = await sequelize.query(
                    'SELECT * FROM CONTACTFIELDVALUE WHERE FIELDID = 28 AND CONTACTID = ?',
                    {
                        replacements: [company.id],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                
                const [existingTaxOffice] = await sequelize.query(
                    'SELECT * FROM CONTACTFIELDVALUE WHERE FIELDID = 29 AND CONTACTID = ?',
                    {
                        replacements: [company.id],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                
                // Vergi numarasını ekle/güncelle
                if (company.vergiNo) {
                    if (!existingTaxNo) {
                        await sequelize.query(
                            'INSERT INTO CONTACTFIELDVALUE (FIELDID, CONTACTID, VALUE, ORID, USERID, DATETIME, DATETIMEEDIT) VALUES (28, ?, ?, 10776, 29701, NOW(), NOW())',
                            {
                                replacements: [company.id, company.vergiNo],
                                type: sequelize.QueryTypes.INSERT
                            }
                        );
                        console.log(`✓ ${company.name} - Vergi No eklendi: ${company.vergiNo}`);
                    } else if (existingTaxNo.VALUE !== company.vergiNo) {
                        await sequelize.query(
                            'UPDATE CONTACTFIELDVALUE SET VALUE = ?, DATETIMEEDIT = NOW() WHERE FIELDID = 28 AND CONTACTID = ?',
                            {
                                replacements: [company.vergiNo, company.id],
                                type: sequelize.QueryTypes.UPDATE
                            }
                        );
                        console.log(`✓ ${company.name} - Vergi No güncellendi: ${company.vergiNo}`);
                    }
                }
                
                // Vergi dairesini ekle/güncelle
                if (company.vergiDairesi) {
                    if (!existingTaxOffice) {
                        await sequelize.query(
                            'INSERT INTO CONTACTFIELDVALUE (FIELDID, CONTACTID, VALUE, ORID, USERID, DATETIME, DATETIMEEDIT) VALUES (29, ?, ?, 10776, 29701, NOW(), NOW())',
                            {
                                replacements: [company.id, company.vergiDairesi],
                                type: sequelize.QueryTypes.INSERT
                            }
                        );
                        console.log(`✓ ${company.name} - Vergi Dairesi eklendi: ${company.vergiDairesi}`);
                    } else if (existingTaxOffice.VALUE !== company.vergiDairesi) {
                        await sequelize.query(
                            'UPDATE CONTACTFIELDVALUE SET VALUE = ?, DATETIMEEDIT = NOW() WHERE FIELDID = 29 AND CONTACTID = ?',
                            {
                                replacements: [company.vergiDairesi, company.id],
                                type: sequelize.QueryTypes.UPDATE
                            }
                        );
                        console.log(`✓ ${company.name} - Vergi Dairesi güncellendi: ${company.vergiDairesi}`);
                    }
                }
                
                console.log(`   ${company.name} (ID: ${company.id})`);
                if (company.vergiNo) console.log(`   Vergi No: ${company.vergiNo}`);
                if (company.vergiDairesi) console.log(`   Vergi Dairesi: ${company.vergiDairesi}`);
                console.log('   ' + '-'.repeat(60));
                
                updatedCount++;
                
            } catch (error) {
                console.error(`Hata (${company.name}):`, error.message);
            }
        }
        
        console.log(`\\n=== ÖZET ===`);
        console.log(`Toplam vergi kaydı: ${taxRecords.length}`);
        console.log(`Vergi bilgisi olan şirket: ${companiesList.length}`);
        console.log(`İşlenen şirket: ${updatedCount}`);
        
        // JSON dosyasına kaydet
        const outputFile = path.join(__dirname, 'companies_tax_final.json');
        fs.writeFileSync(outputFile, JSON.stringify({
            statistics: {
                totalTaxRecords: taxRecords.length,
                companiesWithTaxInfo: companiesList.length,
                processedCompanies: updatedCount
            },
            companies: companiesList
        }, null, 2), 'utf8');
        
        console.log(`\\nVergi bilgileri ${outputFile} dosyasına kaydedildi.`);
        
    } catch (error) {
        console.error('Genel hata:', error.message);
    } finally {
        await sequelize.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
}

// Scripti çalıştır
extractAndImportTaxInfo();