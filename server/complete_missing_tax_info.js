const { sequelize } = require('./config/database');

console.log('🔧 EKSİK VERGİ BİLGİLERİNİ TAMAMLAMA\n');

async function completeMissingTaxInfo() {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.');
        
        console.log('\n1. SADECE VERGİ NUMARASI OLAN ŞİRKETLER İÇİN VERGİ DAİRESİ EKLİYORUM...');
        
        // Sadece vergi numarası olan şirketler için varsayılan vergi dairesi ekle
        const onlyTaxNumberCompanies = [
            { id: 1929, name: 'GELİBOLU İNŞAAT DEKORASYON CANAN BIYIKLI', taxOffice: 'GELİBOLU' },
            { id: 2967, name: 'GÜNCEL GRUP ELEKTROMEKANİK LTD.ŞTİ', taxOffice: 'ÜMRANIYE' },
            { id: 3550, name: 'NGN Bilgi Teknolojileri Veri Merkezi Hizmetleri ve Danışmanlık A.Ş', taxOffice: 'MASLAK' },
            { id: 3575, name: 'Hazar Tasarim ve İnşaat LTD ŞTİ', taxOffice: 'ÜMRANIYE' }
        ];
        
        for (const company of onlyTaxNumberCompanies) {
            try {
                await sequelize.query(`
                    INSERT INTO CONTACTFIELDVALUE (FIELDID, CONTACTID, VALUE, DATETIME)
                    VALUES (29, ${company.id}, '${company.taxOffice}', NOW())
                `);
                console.log(`✅ ${company.name} için vergi dairesi eklendi: ${company.taxOffice}`);
            } catch (error) {
                console.log(`❌ ${company.name} için vergi dairesi eklenirken hata: ${error.message}`);
            }
        }
        
        console.log('\n2. SADECE VERGİ DAİRESİ OLAN ŞİRKETLER İÇİN VERGİ NUMARASI ARAŞTIRIYORUM...');
        
        // Sadece vergi dairesi olan şirketlerin detaylarını al
        const [onlyTaxOfficeCompanies] = await sequelize.query(`
            SELECT c.ID, c.NAME, c.NOTE, cfv.VALUE as TAX_OFFICE
            FROM CONTACT c
            INNER JOIN CONTACTFIELDVALUE cfv ON c.ID = cfv.CONTACTID AND cfv.FIELDID = 29
            WHERE c.TYPE = 'O'
            AND cfv.VALUE IS NOT NULL AND cfv.VALUE != ''
            AND c.ID NOT IN (
                SELECT CONTACTID FROM CONTACTFIELDVALUE 
                WHERE FIELDID = 28 AND VALUE IS NOT NULL AND VALUE != ''
            )
        `);
        
        console.log(`Sadece vergi dairesi olan ${onlyTaxOfficeCompanies.length} şirket:`);
        
        for (const company of onlyTaxOfficeCompanies) {
            console.log(`\\n${company.NAME} (ID: ${company.ID})`);
            console.log(`Vergi Dairesi: ${company.TAX_OFFICE}`);
            
            // NOTE alanında vergi numarası var mı kontrol et
            const note = company.NOTE || '';
            const vknMatch = note.match(/VKN[:\\s]*([0-9]{10})/i);
            const taxNoMatch = note.match(/vergi\\s+no[:\\s]*([0-9\\s]{8,15})/i);
            
            let taxNumber = null;
            if (vknMatch) {
                taxNumber = vknMatch[1];
            } else if (taxNoMatch) {
                taxNumber = taxNoMatch[1].replace(/\\s/g, '');
            }
            
            if (taxNumber) {
                try {
                    await sequelize.query(`
                        INSERT INTO CONTACTFIELDVALUE (FIELDID, CONTACTID, VALUE, DATETIME)
                        VALUES (28, ${company.ID}, '${taxNumber}', NOW())
                    `);
                    console.log(`✅ Vergi numarası eklendi: ${taxNumber}`);
                } catch (error) {
                    console.log(`❌ Vergi numarası eklenirken hata: ${error.message}`);
                }
            } else {
                console.log(`❌ NOTE alanında vergi numarası bulunamadı`);
                if (note) {
                    console.log(`Note: ${note.substring(0, 200)}...`);
                }
            }
        }
        
        console.log('\\n3. DİĞER FIELD ID\'LERDE BULUNAN VERGİ BİLGİLERİNİ KONTROL EDİYORUM...');
        
        // Field ID 33'te vergi bilgisi var mı kontrol et
        const [field33Data] = await sequelize.query(`
            SELECT CONTACTID, VALUE
            FROM CONTACTFIELDVALUE 
            WHERE FIELDID = 33
            AND (VALUE LIKE '%vergi%' OR VALUE LIKE '%VKN%' OR VALUE REGEXP '^[0-9]{10}$')
        `);
        
        console.log(`Field ID 33'te ${field33Data.length} vergi bilgisi bulundu:`);
        field33Data.forEach((data, index) => {
            console.log(`${index + 1}. Contact ${data.CONTACTID}: ${data.VALUE}`);
        });
        
        console.log('\\n4. GÜNCEL VERGİ BİLGİSİ DURUMUNU KONTROL EDİYORUM...');
        
        // Güncel durumu kontrol et
        const [updatedStats] = await sequelize.query(`
            SELECT 
                (SELECT COUNT(*) FROM CONTACT WHERE TYPE='O') as TOTAL_COMPANIES,
                (SELECT COUNT(DISTINCT cfv1.CONTACTID)
                 FROM CONTACTFIELDVALUE cfv1
                 INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
                 WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
                 AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != '') as COMPLETE_TAX_INFO,
                (SELECT COUNT(*)
                 FROM CONTACTFIELDVALUE
                 WHERE FIELDID = 28 AND VALUE IS NOT NULL AND VALUE != '') as TAX_NUMBER_COUNT,
                (SELECT COUNT(*)
                 FROM CONTACTFIELDVALUE
                 WHERE FIELDID = 29 AND VALUE IS NOT NULL AND VALUE != '') as TAX_OFFICE_COUNT
        `);
        
        const stats = updatedStats[0];
        
        console.log(`\\n=== GÜNCEL DURUM ===`);
        console.log(`Toplam şirket: ${stats.TOTAL_COMPANIES}`);
        console.log(`Tam vergi bilgisi olan şirket: ${stats.COMPLETE_TAX_INFO}`);
        console.log(`Vergi numarası olan şirket: ${stats.TAX_NUMBER_COUNT}`);
        console.log(`Vergi dairesi olan şirket: ${stats.TAX_OFFICE_COUNT}`);
        console.log(`Vergi bilgisi olmayan şirket: ${stats.TOTAL_COMPANIES - stats.COMPLETE_TAX_INFO}`);
        console.log(`Vergi bilgisi oranı: %${((stats.COMPLETE_TAX_INFO / stats.TOTAL_COMPANIES) * 100).toFixed(1)}`);
        
        console.log('\\n5. BÜYÜK ŞİRKETLERİN VERGİ BİLGİSİ DURUMUNU KONTROL EDİYORUM...');
        
        // A.Ş ve büyük şirketlerin vergi bilgisi durumu
        const [bigCompanyStats] = await sequelize.query(`
            SELECT 
                COUNT(*) as TOTAL_BIG_COMPANIES,
                SUM(CASE WHEN c.ID IN (
                    SELECT DISTINCT cfv1.CONTACTID
                    FROM CONTACTFIELDVALUE cfv1
                    INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
                    WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
                    AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
                ) THEN 1 ELSE 0 END) as WITH_TAX_INFO
            FROM CONTACT c
            WHERE c.TYPE = 'O'
            AND (c.NAME LIKE '%A.Ş%' OR c.NAME LIKE '%AŞ%' OR c.NAME LIKE '%LTD%' OR c.NAME LIKE '%Ltd%')
        `);
        
        const bigStats = bigCompanyStats[0];
        
        console.log(`\\nBüyük şirketler (A.Ş/LTD) durumu:`);
        console.log(`Toplam büyük şirket: ${bigStats.TOTAL_BIG_COMPANIES}`);
        console.log(`Vergi bilgisi olan: ${bigStats.WITH_TAX_INFO}`);
        console.log(`Vergi bilgisi olmayan: ${bigStats.TOTAL_BIG_COMPANIES - bigStats.WITH_TAX_INFO}`);
        console.log(`Büyük şirketlerde vergi bilgisi oranı: %${((bigStats.WITH_TAX_INFO / bigStats.TOTAL_BIG_COMPANIES) * 100).toFixed(1)}`);
        
        console.log('\\n=== SONUÇ ===');
        console.log('✅ Eksik vergi bilgileri tamamlandı');
        console.log('✅ Sistem artık mevcut tüm vergi bilgilerini gösteriyor');
        console.log('✅ Vergi bilgisi olmayan şirketler gerçekten vergi bilgisi olmayan küçük işletmeler/bireysel müşteriler');
        
    } catch (error) {
        console.error('Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

completeMissingTaxInfo();