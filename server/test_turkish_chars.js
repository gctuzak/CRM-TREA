const mysql = require('mysql2/promise');
require('dotenv').config();

async function testTurkishCharacters() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.MYSQL_USER || 'migration_user',
      password: process.env.MYSQL_PASSWORD || 'migration_pass',
      database: process.env.MYSQL_DATABASE || 'mydatabase',
      charset: 'utf8mb4'
    });

    console.log('🧪 Türkçe karakter testi başlatılıyor...\n');

    // Test verileri - Türkçe karakterler içeren
    const testUsers = [
      { name: 'Mehmet Özkan', email: 'mehmet.ozkan@test.com', password: 'test123' },
      { name: 'Ayşe Güler', email: 'ayse.guler@test.com', password: 'test123' },
      { name: 'İbrahim Çelik', email: 'ibrahim.celik@test.com', password: 'test123' },
      { name: 'Şule Ünlü', email: 'sule.unlu@test.com', password: 'test123' },
      { name: 'Gökhan Işık', email: 'gokhan.isik@test.com', password: 'test123' }
    ];

    console.log('📝 Türkçe karakterli test kullanıcıları ekleniyor...');
    
    for (const user of testUsers) {
      try {
        await connection.execute(
          'INSERT INTO USER (NAME, EMAIL, PASSWORD, STATUS) VALUES (?, ?, ?, ?)',
          [user.name, user.email, user.password, 'active']
        );
        console.log(`  ✅ ${user.name} eklendi`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️ ${user.name} zaten mevcut`);
        } else {
          console.log(`  ❌ ${user.name} eklenirken hata: ${error.message}`);
        }
      }
    }

    console.log('\n🔍 Türkçe karakterli kullanıcıları sorguluyoruz...');
    
    // Türkçe karakterli kullanıcıları getir
    const [turkishUsers] = await connection.execute(`
      SELECT ID, NAME, EMAIL 
      FROM USER 
      WHERE NAME REGEXP '[çğıöşüÇĞIİÖŞÜ]'
      ORDER BY ID
    `);

    console.log('\n📋 Bulunan Türkçe karakterli kullanıcılar:');
    turkishUsers.forEach(user => {
      console.log(`  ID: ${user.ID} | İsim: ${user.NAME} | Email: ${user.EMAIL}`);
    });

    // Özel karakter testleri
    console.log('\n🔤 Özel karakter testleri:');
    
    const specialChars = ['ç', 'ğ', 'ı', 'ö', 'ş', 'ü', 'Ç', 'Ğ', 'I', 'İ', 'Ö', 'Ş', 'Ü'];
    
    for (const char of specialChars) {
      const [results] = await connection.execute(
        'SELECT COUNT(*) as count FROM USER WHERE NAME LIKE ?',
        [`%${char}%`]
      );
      console.log(`  '${char}' karakteri: ${results[0].count} kullanıcıda bulundu`);
    }

    // Test kontakları da ekleyelim
    console.log('\n📞 Türkçe karakterli test kontakları ekleniyor...');
    
    const testContacts = [
      { name: 'Müşteri Hizmetleri', company: 'Türk Telekom A.Ş.', email: 'info@turktelekom.com.tr' },
      { name: 'Satış Müdürü', company: 'İş Bankası', email: 'satis@isbank.com.tr' },
      { name: 'Proje Yöneticisi', company: 'Garanti BBVA', email: 'proje@garanti.com.tr' }
    ];

    for (const contact of testContacts) {
      try {
        await connection.execute(
          'INSERT INTO CONTACT (NAME, COMPANY, EMAIL, STATUS) VALUES (?, ?, ?, ?)',
          [contact.name, contact.company, contact.email, 'active']
        );
        console.log(`  ✅ ${contact.name} (${contact.company}) eklendi`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️ ${contact.name} zaten mevcut`);
        } else {
          console.log(`  ❌ ${contact.name} eklenirken hata: ${error.message}`);
        }
      }
    }

    // Kontakları da test et
    const [turkishContacts] = await connection.execute(`
      SELECT ID, NAME, COMPANY, EMAIL 
      FROM CONTACT 
      WHERE NAME REGEXP '[çğıöşüÇĞIİÖŞÜ]' OR COMPANY REGEXP '[çğıöşüÇĞIİÖŞÜ]'
      ORDER BY ID
    `);

    console.log('\n📋 Bulunan Türkçe karakterli kontaklar:');
    turkishContacts.forEach(contact => {
      console.log(`  ID: ${contact.ID} | İsim: ${contact.NAME} | Şirket: ${contact.COMPANY} | Email: ${contact.EMAIL}`);
    });

    // Görev testleri
    console.log('\n📋 Türkçe karakterli test görevleri ekleniyor...');
    
    const testTasks = [
      { note: 'Müşteri görüşmesi planla - Yeni müşteri ile görüşme ayarla' },
      { note: 'Teklif hazırla - Proje için detaylı teklif dökümanı hazırla' },
      { note: 'Sunum yap - Yönetim kuruluna aylık rapor sunumu' }
    ];

    for (const task of testTasks) {
      try {
        await connection.execute(
          'INSERT INTO TASK (NOTE, STATUS, USERID, ORID) VALUES (?, ?, ?, ?)',
          [task.note, 'New', 1, Math.floor(Math.random() * 1000000)]
        );
        console.log(`  ✅ ${task.note.split(' - ')[0]} eklendi`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️ ${task.note.split(' - ')[0]} zaten mevcut`);
        } else {
          console.log(`  ❌ ${task.note.split(' - ')[0]} eklenirken hata: ${error.message}`);
        }
      }
    }

    const [turkishTasks] = await connection.execute(`
      SELECT ID, NOTE 
      FROM TASK 
      WHERE NOTE REGEXP '[çğıöşüÇĞIİÖŞÜ]'
      ORDER BY ID
    `);

    console.log('\n📋 Bulunan Türkçe karakterli görevler:');
    turkishTasks.forEach(task => {
      console.log(`  ID: ${task.ID} | Not: ${task.NOTE}`);
    });

    console.log('\n✅ Türkçe karakter testi tamamlandı!');
    console.log(`📊 Toplam Türkçe karakterli kayıt sayısı:`);
    console.log(`  👥 Kullanıcılar: ${turkishUsers.length}`);
    console.log(`  📞 Kontaklar: ${turkishContacts.length}`);
    console.log(`  📋 Görevler: ${turkishTasks.length}`);

    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
    return false;
  }
}

testTurkishCharacters().catch(console.error);