const { sequelize } = require('./config/database');

console.log('🔍 DERİNLEMESİNE EKSİK VERGİ BİLGİSİ ARAMA\n');

async function deepMissingTaxSearch() {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.');
        
        console.log('\n1. VERGİ BİLGİSİ OLMAYAN ŞİRKETLERİN NOTE ALANLARINI ANALİZ EDİYORUM...');
        
        // Vergi bilgisi olmayan şirketlerin NOTE alanlarını kontrol et
        const [companiesWithoutTax] = await sequelize.query(`
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
            AND (c.NOTE IS NOT NULL AND c.NOTE != '')
            ORDER BY c.ID
            LIMIT 100
        `);
        
        console.log(`NOTE alanı dolu olan ${companiesWithoutTax.length} şirket bulundu.`);
        
        const potentialTaxInfo = [];
        
        companiesWithoutTax.forEach((company, index) => {
            const note = company.NOTE || '';
            const noteLower = note.toLowerCase();
            
            // Farklı vergi pattern'leri ara
            let foundTaxInfo = false;
            let taxNumber = null;
            let taxOffice = null;
            
            // Pattern 1: VKN
            const vknMatch = note.match(/VKN[:\\s]*([0-9]{10})/i);
            if (vknMatch) {
                taxNumber = vknMatch[1];
                foundTaxInfo = true;
            }
            
            // Pattern 2: Vergi No
            if (!taxNumber) {
                const taxNoMatch = note.match(/vergi\\s+no[:\\s]*([0-9\\s]{8,15})/i);
                if (taxNoMatch) {
                    taxNumber = taxNoMatch[1].replace(/\\s/g, '');
                    foundTaxInfo = true;
                }
            }
            
            // Pattern 3: 10 haneli sayı (vergi numarası olabilir)
            if (!taxNumber) {
                const tenDigitMatch = note.match(/\\b([0-9]{10})\\b/);
                if (tenDigitMatch) {
                    taxNumber = tenDigitMatch[1];
                    foundTaxInfo = true;
                }
            }
            
            // Pattern 4: Vergi dairesi
            const taxOfficeMatch = note.match(/vergi\\s+dairesi[:\\s]*([^\\r\\n]+)/i);
            if (taxOfficeMatch) {
                taxOffice = taxOfficeMatch[1].trim();
                foundTaxInfo = true;
            }
            
            // Pattern 5: "daire" kelimesi (vergi dairesi olabilir)
            if (!taxOffice && noteLower.includes('daire') && !noteLower.includes('daire:')) {
                const daireMatch = note.match(/([A-ZÇĞIİÖŞÜ\\s]+)\\s+daire/i);
                if (daireMatch) {
                    const potentialOffice = daireMatch[1].trim();
                    if (potentialOffice.length > 3 && potentialOffice.length < 30) {
                        taxOffice = potentialOffice + ' daire';
                        foundTaxInfo = true;
                    }
                }
            }
            
            if (foundTaxInfo) {
                console.log(`\\n${potentialTaxInfo.length + 1}. ID: ${company.ID} - ${company.NAME}`);
                if (taxNumber) console.log(`   Potansiyel Vergi No: ${taxNumber}`);
                if (taxOffice) console.log(`   Potansiyel Vergi Dairesi: ${taxOffice}`);
                console.log(`   Note: ${note.substring(0, 200)}...`);
                
                potentialTaxInfo.push({
                    contactId: company.ID,
                    name: company.NAME,
                    taxNumber: taxNumber,
                    taxOffice: taxOffice,
                    note: note
                });
            }
        });
        
        console.log(`\\n=== POTANSIYEL VERGİ BİLGİLERİ ===`);
        console.log(`${potentialTaxInfo.length} şirket için potansiyel vergi bilgisi bulundu.`);
        
        console.log('\\n2. CONTACTFIELDVALUE TABLOSUNDA EKSİK ALANLAR VAR MI?');
        
        // Sadece vergi numarası olan ama vergi dairesi olmayan kayıtlar
        const [onlyTaxNumber] = await sequelize.query(`
            SELECT c.ID, c.NAME, cfv.VALUE as TAX_NUMBER
            FROM CONTACT c
            INNER JOIN CONTACTFIELDVALUE cfv ON c.ID = cfv.CONTACTID AND cfv.FIELDID = 28
            WHERE c.TYPE = 'O'
            AND cfv.VALUE IS NOT NULL AND cfv.VALUE != ''
            AND c.ID NOT IN (
                SELECT CONTACTID FROM CONTACTFIELDVALUE 
                WHERE FIELDID = 29 AND VALUE IS NOT NULL AND VALUE != ''
            )
        `);
        
        console.log(`\\nSadece vergi numarası olan ${onlyTaxNumber.length} şirket:`);
        onlyTaxNumber.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.ID} - ${company.NAME} (VN: ${company.TAX_NUMBER})`);
        });
        
        // Sadece vergi dairesi olan ama vergi numarası olmayan kayıtlar
        const [onlyTaxOffice] = await sequelize.query(`
            SELECT c.ID, c.NAME, cfv.VALUE as TAX_OFFICE
            FROM CONTACT c
            INNER JOIN CONTACTFIELDVALUE cfv ON c.ID = cfv.CONTACTID AND cfv.FIELDID = 29
            WHERE c.TYPE = 'O'
            AND cfv.VALUE IS NOT NULL AND cfv.VALUE != ''
            AND c.ID NOT IN (
                SELECT CONTACTID FROM CONTACTFIELDVALUE 
                WHERE FIELDID = 28 AND VALUE IS NOT NULL AND VALUE != ''
            )
        `);
        
        console.log(`\\nSadece vergi dairesi olan ${onlyTaxOffice.length} şirket:`);
        onlyTaxOffice.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.ID} - ${company.NAME} (VD: ${company.TAX_OFFICE})`);
        });
        
        console.log('\\n3. DİĞER FIELD ID\'LERDE VERGİ BİLGİSİ VAR MI?');
        
        // Diğer field ID'lerde vergi ile ilgili bilgi var mı kontrol et
        const [otherFields] = await sequelize.query(`
            SELECT FIELDID, COUNT(*) as COUNT
            FROM CONTACTFIELDVALUE 
            WHERE FIELDID NOT IN (28, 29)
            AND (VALUE LIKE '%vergi%' OR VALUE LIKE '%VKN%' OR VALUE REGEXP '^[0-9]{10}$')
            GROUP BY FIELDID
            ORDER BY COUNT DESC
        `);
        
        console.log(`\\nDiğer field'larda vergi bilgisi:`);
        otherFields.forEach((field, index) => {
            console.log(`${index + 1}. Field ID ${field.FIELDID}: ${field.COUNT} kayıt`);
        });
        
        console.log('\\n4. ŞİRKET İSİMLERİNDEN VERGİ BİLGİSİ ÇIKARILABİLİR Mİ?');
        
        // Şirket isimlerinde "Ltd", "A.Ş" gibi ifadeler var mı kontrol et
        const [companyTypes] = await sequelize.query(`
            SELECT 
                SUM(CASE WHEN NAME LIKE '%LTD%' OR NAME LIKE '%Ltd%' THEN 1 ELSE 0 END) as LTD_COUNT,
                SUM(CASE WHEN NAME LIKE '%A.Ş%' OR NAME LIKE '%AŞ%' OR NAME LIKE '%A.S%' THEN 1 ELSE 0 END) as AS_COUNT,
                SUM(CASE WHEN NAME LIKE '%SAN%' OR NAME LIKE '%TİC%' OR NAME LIKE '%İNŞ%' THEN 1 ELSE 0 END) as COMMERCIAL_COUNT,
                COUNT(*) as TOTAL_WITHOUT_TAX
            FROM CONTACT c
            WHERE c.TYPE = 'O'
            AND c.ID NOT IN (
                SELECT DISTINCT cfv1.CONTACTID
                FROM CONTACTFIELDVALUE cfv1
                INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
                WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
                AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
            )
        `);
        
        console.log(`\\nVergi bilgisi olmayan şirketlerin tipleri:`);
        console.log(`LTD/Ltd içeren: ${companyTypes[0].LTD_COUNT}`);
        console.log(`A.Ş/AŞ içeren: ${companyTypes[0].AS_COUNT}`);
        console.log(`SAN/TİC/İNŞ içeren: ${companyTypes[0].COMMERCIAL_COUNT}`);
        console.log(`Toplam: ${companyTypes[0].TOTAL_WITHOUT_TAX}`);
        
        console.log('\\n=== SONUÇ VE ÖNERİLER ===');
        console.log(`1. ${potentialTaxInfo.length} şirket için NOTE alanında potansiyel vergi bilgisi bulundu`);
        console.log(`2. ${onlyTaxNumber.length} şirketin sadece vergi numarası var`);
        console.log(`3. ${onlyTaxOffice.length} şirketin sadece vergi dairesi var`);
        console.log(`4. Çoğu şirket küçük işletme/bireysel müşteri olabilir`);
        
        // Büyük şirketleri kontrol et (A.Ş, büyük isimler)
        const [bigCompaniesWithoutTax] = await sequelize.query(`
            SELECT ID, NAME
            FROM CONTACT 
            WHERE TYPE = 'O'
            AND (NAME LIKE '%A.Ş%' OR NAME LIKE '%AŞ%' OR NAME LIKE '%GRUP%' OR NAME LIKE '%HOLDİNG%')
            AND ID NOT IN (
                SELECT DISTINCT cfv1.CONTACTID
                FROM CONTACTFIELDVALUE cfv1
                INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
                WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
                AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
            )
            LIMIT 20
        `);
        
        console.log(`\\nVergi bilgisi olmayan büyük şirketler (${bigCompaniesWithoutTax.length}):`);
        bigCompaniesWithoutTax.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.ID} - ${company.NAME}`);
        });
        
    } catch (error) {
        console.error('Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

deepMissingTaxSearch();