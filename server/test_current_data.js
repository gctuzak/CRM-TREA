const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCurrentData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase',
      charset: 'utf8mb4'
    });

    console.log('📊 Mevcut veritabanı durumu:\n');

    // Tablo sayıları
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM USER');
    const [contacts] = await connection.execute('SELECT COUNT(*) as count FROM CONTACT');
    const [opportunities] = await connection.execute('SELECT COUNT(*) as count FROM OPPORTUNITY');
    
    console.log('📈 Kayıt sayıları:');
    console.log(`  👥 Kullanıcılar: ${users[0].count}`);
    console.log(`  📞 Kontaklar: ${contacts[0].count}`);
    console.log(`  💼 Fırsatlar: ${opportunities[0].count}`);

    // CONTACT tablosundan örnek veriler
    console.log('\n📋 İlk 10 kontak:');
    const [contactSamples] = await connection.execute('SELECT ID, NAME, PARENTCONTACTNAME FROM CONTACT LIMIT 10');
    contactSamples.forEach(contact => {
      console.log(`  ID: ${contact.ID} | İsim: ${contact.NAME} | Şirket: ${contact.PARENTCONTACTNAME}`);
    });

    // Türkçe karakter testi
    console.log('\n🔤 Türkçe karakterli kontaklar:');
    const [turkishContacts] = await connection.execute('SELECT NAME FROM CONTACT WHERE NAME REGEXP "[çğıöşüÇĞIİÖŞÜ]" LIMIT 10');
    
    if (turkishContacts.length > 0) {
      turkishContacts.forEach(contact => {
        console.log(`  ✅ ${contact.NAME}`);
      });
    } else {
      console.log('  ⚠️ Türkçe karakterli kontak bulunamadı');
    }

    // USER tablosundan örnek veriler
    console.log('\n👥 İlk 5 kullanıcı:');
    const [userSamples] = await connection.execute('SELECT ID, NAME, EMAIL FROM USER LIMIT 5');
    userSamples.forEach(user => {
      console.log(`  ID: ${user.ID} | İsim: ${user.NAME} | Email: ${user.EMAIL}`);
    });

    await connection.end();
    console.log('\n✅ Test tamamlandı!');
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testCurrentData();