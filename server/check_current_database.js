const { sequelize } = require('./config/database');

console.log('🔍 MEVCUT VERİTABANI VERGİ BİLGİSİ KONTROLÜ\n');

async function checkCurrentDatabase() {
    try {
        // Veritabanına bağlan
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.');
        
        console.log('\n1. CONTACT TABLOSU ANALİZ:');
        
        // Toplam contact sayısı
        const [totalContacts] = await sequelize.query('SELECT COUNT(*) as count FROM CONTACT');
        console.log(`Toplam contact sayısı: ${totalContacts[0].count}`);
        
        // Şirket sayısı (type='O')
        const [totalCompanies] = await sequelize.query("SELECT COUNT(*) as count FROM CONTACT WHERE TYPE='O'");
        console.log(`Toplam şirket sayısı: ${totalCompanies[0].count}`);
        
        // Kişi sayısı (type='P')
        const [totalPeople] = await sequelize.query("SELECT COUNT(*) as count FROM CONTACT WHERE TYPE='P'");
        console.log(`Toplam kişi sayısı: ${totalPeople[0].count}`);
        
        console.log('\n2. VERGİ BİLGİSİ ANALİZ:');
        
        // Field ID 28 (Vergi No) olan kayıtlar
        const [taxNumbers] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM CONTACTFIELDVALUE 
            WHERE FIELDID = 28 AND VALUE IS NOT NULL AND VALUE != ''
        `);
        console.log(`Vergi numarası olan contact sayısı: ${taxNumbers[0].count}`);
        
        // Field ID 29 (Vergi Dairesi) olan kayıtlar
        const [taxOffices] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM CONTACTFIELDVALUE 
            WHERE FIELDID = 29 AND VALUE IS NOT NULL AND VALUE != ''
        `);
        console.log(`Vergi dairesi olan contact sayısı: ${taxOffices[0].count}`);
        
        // Tam vergi bilgisi olan contact'lar
        const [completeTaxInfo] = await sequelize.query(`
            SELECT COUNT(DISTINCT cfv1.CONTACTID) as count
            FROM CONTACTFIELDVALUE cfv1
            INNER JOIN CONTACTFIELDVALUE cfv2 ON cfv1.CONTACTID = cfv2.CONTACTID
            WHERE cfv1.FIELDID = 28 AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
            AND cfv2.FIELDID = 29 AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
        `);
        console.log(`Tam vergi bilgisi olan contact sayısı: ${completeTaxInfo[0].count}`);
        
        console.log('\n3. VERGİ BİLGİSİ OLAN ŞİRKETLER:');
        
        // Vergi bilgisi olan şirketleri listele
        const [companiesWithTax] = await sequelize.query(`
            SELECT DISTINCT c.ID, c.NAME, 
                   cfv1.VALUE as TAX_NUMBER,
                   cfv2.VALUE as TAX_OFFICE
            FROM CONTACT c
            INNER JOIN CONTACTFIELDVALUE cfv1 ON c.ID = cfv1.CONTACTID AND cfv1.FIELDID = 28
            INNER JOIN CONTACTFIELDVALUE cfv2 ON c.ID = cfv2.CONTACTID AND cfv2.FIELDID = 29
            WHERE c.TYPE = 'O'
            AND cfv1.VALUE IS NOT NULL AND cfv1.VALUE != ''
            AND cfv2.VALUE IS NOT NULL AND cfv2.VALUE != ''
            ORDER BY c.ID
            LIMIT 20
        `);
        
        console.log(`Vergi bilgisi olan şirketler (ilk 20):`);
        companiesWithTax.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.ID} - ${company.NAME}`);
            console.log(`   Vergi No: ${company.TAX_NUMBER}`);
            console.log(`   Vergi Dairesi: ${company.TAX_OFFICE}`);
            console.log('');
        });
        
        console.log('\n4. VERGİ BİLGİSİ OLMAYAN ŞİRKETLER:');
        
        // Vergi bilgisi olmayan şirketleri bul
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
            ORDER BY c.ID
            LIMIT 50
        `);
        
        console.log(`Vergi bilgisi olmayan şirketler (ilk 50):`);
        companiesWithoutTax.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.ID} - ${company.NAME}`);
            if (company.NOTE && company.NOTE.length > 0) {
                const notePreview = company.NOTE.length > 100 ? company.NOTE.substring(0, 100) + '...' : company.NOTE;
                console.log(`   Note: ${notePreview}`);
            }
            console.log('');
        });
        
        console.log('\n5. NOTE ALANLARINDA VERGİ BİLGİSİ ARAMA:');
        
        // NOTE alanlarında VKN bilgisi olan şirketler
        const [noteTaxInfo] = await sequelize.query(`
            SELECT ID, NAME, NOTE
            FROM CONTACT 
            WHERE TYPE = 'O' 
            AND (NOTE LIKE '%VKN%' OR NOTE LIKE '%vergi%' OR NOTE LIKE '%Vergi%')
            LIMIT 10
        `);
        
        console.log(`NOTE alanında vergi bilgisi olan şirketler:`);
        noteTaxInfo.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company.ID} - ${company.NAME}`);
            console.log(`   Note: ${company.NOTE.substring(0, 200)}...`);
            console.log('');
        });
        
        console.log('\n=== ÖZET ===');
        console.log(`Toplam şirket: ${totalCompanies[0].count}`);
        console.log(`Vergi bilgisi olan şirket: ${completeTaxInfo[0].count}`);
        console.log(`Vergi bilgisi olmayan şirket: ${totalCompanies[0].count - completeTaxInfo[0].count}`);
        console.log(`Vergi bilgisi oranı: %${((completeTaxInfo[0].count / totalCompanies[0].count) * 100).toFixed(1)}`);
        
    } catch (error) {
        console.error('Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkCurrentDatabase();