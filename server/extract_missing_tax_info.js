const { sequelize } = require('./config/database');

console.log('🔍 EKSİK VERGİ BİLGİLERİNİ ÇIKARMA VE AKTARMA\n');

async function extractMissingTaxInfo() {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.');
        
        console.log('\n1. NOTE ALANLARINDA VERGİ BİLGİSİ OLAN ŞİRKETLER:');
        
        // NOTE alanlarında vergi bilgisi olan şirketleri bul
        const [companiesWithNoteVKN] = await sequelize.query(`
            SELECT ID, NAME, NOTE
            FROM CONTACT 
            WHERE TYPE = 'O' 
            AND (NOTE LIKE '%VKN%' OR NOTE LIKE '%vergi%' OR NOTE LIKE '%Vergi%')
            AND ID NOT IN (
                SELECT DISTINCT cfv1.CONTACTID
                FROM CONTACTFIELDVALUE cfv1
                INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
                WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
                AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
            )
        `);
        
        console.log(`NOTE alanında vergi bilgisi olan ${companiesWithNoteVKN.length} şirket bulundu:`);
        
        const extractedTaxInfo = [];
        
        companiesWithNoteVKN.forEach((company, index) => {
            console.log(`\\n${index + 1}. ID: ${company.ID} - ${company.NAME}`);
            
            const note = company.NOTE || '';
            
            // VKN pattern'i ara
            const vknMatch = note.match(/VKN[:\\s]*([0-9]{10})/i);
            let taxNumber = null;
            if (vknMatch) {
                taxNumber = vknMatch[1];
                console.log(`   VKN bulundu: ${taxNumber}`);
            }
            
            // Vergi No pattern'i ara
            if (!taxNumber) {
                const taxNoMatch = note.match(/vergi\\s+no[:\\s]*([0-9\\s]{8,15})/i);
                if (taxNoMatch) {
                    taxNumber = taxNoMatch[1].replace(/\\s/g, '');
                    console.log(`   Vergi No bulundu: ${taxNumber}`);
                }
            }
            
            // Vergi dairesi pattern'i ara
            const taxOfficeMatch = note.match(/vergi\\s+dairesi[:\\s]*([^\\r\\n]+)/i);
            let taxOffice = null;
            if (taxOfficeMatch) {
                taxOffice = taxOfficeMatch[1].trim();
                console.log(`   Vergi Dairesi bulundu: ${taxOffice}`);
            }
            
            if (taxNumber || taxOffice) {
                extractedTaxInfo.push({
                    contactId: company.ID,
                    name: company.NAME,
                    taxNumber: taxNumber,
                    taxOffice: taxOffice
                });
            }
        });
        
        console.log(`\\n=== ÇIKARILAN VERGİ BİLGİLERİ ===`);
        console.log(`Toplam ${extractedTaxInfo.length} şirket için vergi bilgisi çıkarıldı:`);
        
        extractedTaxInfo.forEach((info, index) => {
            console.log(`${index + 1}. ${info.name} (ID: ${info.contactId})`);
            if (info.taxNumber) console.log(`   Vergi No: ${info.taxNumber}`);
            if (info.taxOffice) console.log(`   Vergi Dairesi: ${info.taxOffice}`);
            console.log('');
        });
        
        console.log('\\n2. VERGİ BİLGİLERİNİ VERİTABANINA AKTARIYORUM...');
        
        let insertedCount = 0;
        
        for (const info of extractedTaxInfo) {
            try {
                // Vergi numarasını ekle (Field ID 28)
                if (info.taxNumber) {
                    await sequelize.query(`
                        INSERT INTO CONTACTFIELDVALUE (FIELDID, CONTACTID, VALUE, DATETIME)
                        VALUES (28, ${info.contactId}, '${info.taxNumber}', NOW())
                    `);
                    console.log(`✅ ${info.name} için vergi numarası eklendi: ${info.taxNumber}`);
                }
                
                // Vergi dairesini ekle (Field ID 29)
                if (info.taxOffice) {
                    await sequelize.query(`
                        INSERT INTO CONTACTFIELDVALUE (FIELDID, CONTACTID, VALUE, DATETIME)
                        VALUES (29, ${info.contactId}, '${info.taxOffice}', NOW())
                    `);
                    console.log(`✅ ${info.name} için vergi dairesi eklendi: ${info.taxOffice}`);
                }
                
                insertedCount++;
                
            } catch (error) {
                console.log(`❌ ${info.name} için vergi bilgisi eklenirken hata: ${error.message}`);
            }
        }
        
        console.log(`\\n=== SONUÇ ===`);
        console.log(`${insertedCount} şirket için vergi bilgisi başarıyla eklendi.`);
        
        console.log('\\n3. GÜNCEL VERGİ BİLGİSİ DURUMUNU KONTROL EDİYORUM...');
        
        // Güncel durumu kontrol et
        const [updatedTaxCount] = await sequelize.query(`
            SELECT COUNT(DISTINCT cfv1.CONTACTID) as count
            FROM CONTACTFIELDVALUE cfv1
            INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
            WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
            AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
        `);
        
        const [totalCompanies] = await sequelize.query("SELECT COUNT(*) as count FROM CONTACT WHERE TYPE='O'");
        
        console.log(`\\n=== GÜNCEL DURUM ===`);
        console.log(`Toplam şirket: ${totalCompanies[0].count}`);
        console.log(`Vergi bilgisi olan şirket: ${updatedTaxCount[0].count}`);
        console.log(`Vergi bilgisi olmayan şirket: ${totalCompanies[0].count - updatedTaxCount[0].count}`);
        console.log(`Vergi bilgisi oranı: %${((updatedTaxCount[0].count / totalCompanies[0].count) * 100).toFixed(1)}`);
        
        console.log('\\n4. HALA VERGİ BİLGİSİ OLMAYAN ŞİRKETLERİ KONTROL EDİYORUM...');
        
        // Hala vergi bilgisi olmayan şirketleri listele
        const [stillMissingTax] = await sequelize.query(`
            SELECT c.ID, c.NAME, c.NOTE
            FROM CONTACT c
            WHERE c.TYPE = 'O'
            AND c.ID NOT IN (
                SELECT DISTINCT cfv1.CONTACTID
                FROM CONTACTFIELDVALUE cfv1
                INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
                WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
                AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
            )
            ORDER BY c.ID
            LIMIT 20
        `);
        
        console.log(`\\nHala vergi bilgisi olmayan şirketler (ilk 20):`);
        stillMissingTax.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.ID} - ${company.NAME}`);
            if (company.NOTE && company.NOTE.length > 0) {
                const notePreview = company.NOTE.length > 100 ? company.NOTE.substring(0, 100) + '...' : company.NOTE;
                console.log(`   Note: ${notePreview}`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

extractMissingTaxInfo();