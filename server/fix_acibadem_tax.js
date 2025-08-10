const { sequelize } = require('./config/database');

async function fixAcibademTax() {
    try {
        await sequelize.authenticate();
        console.log('Veritabanına bağlanıldı.');
        
        // ACIBADEM PROJE YÖNETİMİ için vergi numarası ekle
        const contactId = 2;
        const vkn = '0050008904'; // Diğer ACIBADEM şirketleriyle aynı
        const taxOffice = 'BÜYÜK MÜKELLEFLER'; // Doğru vergi dairesi
        
        // Önce mevcut vergi numarası kaydını kontrol et
        const [existingVKN] = await sequelize.query(
            'SELECT * FROM CONTACTFIELDVALUE WHERE CONTACTID = ? AND FIELDID = 28',
            {
                replacements: [contactId],
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        if (!existingVKN) {
            // Vergi numarası yoksa ekle
            await sequelize.query(
                'INSERT INTO CONTACTFIELDVALUE (FIELDID, CONTACTID, VALUE, ORID, USERID, DATETIME, DATETIMEEDIT) VALUES (28, ?, ?, 10776, 29701, NOW(), NOW())',
                {
                    replacements: [contactId, vkn],
                    type: sequelize.QueryTypes.INSERT
                }
            );
            console.log(`✓ ACIBADEM PROJE YÖNETİMİ - Vergi No eklendi: ${vkn}`);
        } else {
            // Varsa güncelle
            await sequelize.query(
                'UPDATE CONTACTFIELDVALUE SET VALUE = ?, DATETIMEEDIT = NOW() WHERE CONTACTID = ? AND FIELDID = 28',
                {
                    replacements: [vkn, contactId],
                    type: sequelize.QueryTypes.UPDATE
                }
            );
            console.log(`✓ ACIBADEM PROJE YÖNETİMİ - Vergi No güncellendi: ${vkn}`);
        }
        
        // Vergi dairesini de güncelle
        await sequelize.query(
            'UPDATE CONTACTFIELDVALUE SET VALUE = ?, DATETIMEEDIT = NOW() WHERE CONTACTID = ? AND FIELDID = 29',
            {
                replacements: [taxOffice, contactId],
                type: sequelize.QueryTypes.UPDATE
            }
        );
        console.log(`✓ ACIBADEM PROJE YÖNETİMİ - Vergi Dairesi güncellendi: ${taxOffice}`);
        
        // Sonucu kontrol et
        const [results] = await sequelize.query(
            'SELECT FIELDID, VALUE FROM CONTACTFIELDVALUE WHERE CONTACTID = ? AND FIELDID IN (28, 29)',
            {
                replacements: [contactId],
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        console.log('\\nGüncellenmiş vergi bilgileri:');
        results.forEach(row => {
            const fieldName = row.FIELDID === 28 ? 'Vergi No' : 'Vergi Dairesi';
            console.log(`${fieldName}: ${row.VALUE}`);
        });
        
    } catch (error) {
        console.error('Hata:', error.message);
    } finally {
        await sequelize.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
}

fixAcibademTax();