const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Veritabanı bağlantı ayarları
const dbConfig = {
    host: 'localhost',
    user: 'crmuser',
    password: 'crmpassword',
    database: 'mydatabase',
    charset: 'utf8mb4'
};

async function importCompanyNotes() {
    let connection;
    
    try {
        // JSON dosyasını oku
        const notesFile = path.join(__dirname, 'company_notes_extracted_v3.json');
        const notesData = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
        
        console.log(`${notesData.length} şirket NOTE bilgisi yüklenecek...`);
        
        // Veritabanına bağlan
        connection = await mysql.createConnection(dbConfig);
        console.log('Veritabanına bağlanıldı.');
        
        let updatedCount = 0;
        let notFoundCount = 0;
        
        for (const company of notesData) {
            try {
                // Şirket adına göre kayıt bul
                const [rows] = await connection.execute(
                    'SELECT id, name, note FROM contacts WHERE name = ? AND type = ?',
                    [company.name, 'O']
                );
                
                if (rows.length > 0) {
                    const contact = rows[0];
                    
                    // NOTE alanını temizle (\\r\\n -> gerçek satır sonları)
                    let cleanNote = company.note
                        .replace(/\\r\\n/g, '\n')
                        .replace(/\\r/g, '\n')
                        .replace(/\\n/g, '\n')
                        .trim();
                    
                    // Mevcut NOTE ile karşılaştır
                    if (contact.note !== cleanNote) {
                        // NOTE alanını güncelle
                        await connection.execute(
                            'UPDATE contacts SET note = ? WHERE id = ?',
                            [cleanNote, contact.id]
                        );
                        
                        console.log(`✓ ${company.name} (ID: ${contact.id}) - NOTE güncellendi`);
                        console.log(`  Eski: ${contact.note || 'BOŞ'}`);
                        console.log(`  Yeni: ${cleanNote.substring(0, 100)}...`);
                        console.log('  ' + '-'.repeat(80));
                        
                        updatedCount++;
                    } else {
                        console.log(`- ${company.name} (ID: ${contact.id}) - NOTE zaten güncel`);
                    }
                } else {
                    console.log(`⚠ ${company.name} - Veritabanında bulunamadı`);
                    notFoundCount++;
                }
            } catch (error) {
                console.error(`Hata (${company.name}):`, error.message);
            }
        }
        
        console.log(`\\n=== ÖZET ===`);
        console.log(`Toplam işlenen şirket: ${notesData.length}`);
        console.log(`Güncellenen şirket: ${updatedCount}`);
        console.log(`Bulunamayan şirket: ${notFoundCount}`);
        console.log(`Değişiklik olmayan: ${notesData.length - updatedCount - notFoundCount}`);
        
    } catch (error) {
        console.error('Genel hata:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Veritabanı bağlantısı kapatıldı.');
        }
    }
}

// Scripti çalıştır
importCompanyNotes();