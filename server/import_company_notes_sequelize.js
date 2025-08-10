const { sequelize } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function importCompanyNotes() {
    try {
        // JSON dosyasını oku
        const notesFile = path.join(__dirname, 'company_notes_extracted_v3.json');
        const notesData = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
        
        console.log(`${notesData.length} şirket NOTE bilgisi yüklenecek...`);
        
        // Veritabanına bağlan
        await sequelize.authenticate();
        console.log('Veritabanına bağlanıldı.');
        
        let updatedCount = 0;
        let notFoundCount = 0;
        let unchangedCount = 0;
        
        for (const company of notesData) {
            try {
                // Şirket adına göre kayıt bul
                const [rows] = await sequelize.query(
                    'SELECT ID as id, NAME as name, NOTE as note FROM CONTACT WHERE NAME = ? AND TYPE = ?',
                    {
                        replacements: [company.name, 'O'],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                
                if (rows) {
                    const contact = rows;
                    
                    // NOTE alanını temizle (\\r\\n -> gerçek satır sonları)
                    let cleanNote = company.note
                        .replace(/\\\\r\\\\n/g, '\n')
                        .replace(/\\\\r/g, '\n')
                        .replace(/\\\\n/g, '\n')
                        .replace(/\\r\\n/g, '\n')
                        .replace(/\\r/g, '\n')
                        .replace(/\\n/g, '\n')
                        .trim();
                    
                    // Mevcut NOTE ile karşılaştır
                    if (contact.note !== cleanNote) {
                        // NOTE alanını güncelle
                        await sequelize.query(
                            'UPDATE CONTACT SET NOTE = ? WHERE ID = ?',
                            {
                                replacements: [cleanNote, contact.id],
                                type: sequelize.QueryTypes.UPDATE
                            }
                        );
                        
                        console.log(`✓ ${company.name} (ID: ${contact.id}) - NOTE güncellendi`);
                        console.log(`  Eski: ${contact.note || 'BOŞ'}`);
                        console.log(`  Yeni: ${cleanNote.substring(0, 100)}${cleanNote.length > 100 ? '...' : ''}`);
                        console.log('  ' + '-'.repeat(80));
                        
                        updatedCount++;
                    } else {
                        console.log(`- ${company.name} (ID: ${contact.id}) - NOTE zaten güncel`);
                        unchangedCount++;
                    }
                } else {
                    console.log(`⚠ ${company.name} - Veritabanında bulunamadı`);
                    notFoundCount++;
                }
            } catch (error) {
                console.error(`Hata (${company.name}):`, error.message);
            }
        }
        
        console.log(`\n=== ÖZET ===`);
        console.log(`Toplam işlenen şirket: ${notesData.length}`);
        console.log(`Güncellenen şirket: ${updatedCount}`);
        console.log(`Bulunamayan şirket: ${notFoundCount}`);
        console.log(`Değişiklik olmayan: ${unchangedCount}`);
        
    } catch (error) {
        console.error('Genel hata:', error.message);
    } finally {
        await sequelize.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
}

// Scripti çalıştır
importCompanyNotes();