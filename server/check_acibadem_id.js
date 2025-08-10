const { sequelize } = require('./config/database');

async function checkAcibademId() {
    try {
        await sequelize.authenticate();
        
        // ACIBADEM PROJE YÖNETİMİ'nin ID'sini bul
        const [results] = await sequelize.query(
            'SELECT ID, NAME FROM CONTACT WHERE NAME LIKE "%ACIBADEM PROJE%" AND TYPE = "O"',
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log('ACIBADEM PROJE YÖNETİMİ:', results);
        
        if (results) {
            const contactId = results.ID;
            console.log('Contact ID:', contactId);
            
            // Bu ID için vergi bilgilerini kontrol et
            const [taxInfo] = await sequelize.query(
                'SELECT FIELDID, VALUE FROM CONTACTFIELDVALUE WHERE CONTACTID = ? AND FIELDID IN (28, 29, 30)',
                { 
                    replacements: [contactId],
                    type: sequelize.QueryTypes.SELECT 
                }
            );
            
            console.log('Vergi bilgileri:', taxInfo);
        }
        
    } catch (error) {
        console.error('Hata:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkAcibademId();