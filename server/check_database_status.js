const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStatus() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.MYSQL_USER || 'migration_user',
      password: process.env.MYSQL_PASSWORD || 'migration_pass',
      database: process.env.MYSQL_DATABASE || 'mydatabase',
      charset: 'utf8mb4'
    });

    console.log('📊 Veritabanı durumu detaylı raporu\n');

    // Kullanıcılar
    console.log('👥 KULLANICILAR:');
    const [users] = await connection.execute('SELECT ID, NAME, EMAIL, STATUS FROM USER ORDER BY ID');
    console.log(`Toplam: ${users.length} kullanıcı`);
    users.forEach(user => {
      console.log(`  ID: ${user.ID} | İsim: ${user.NAME} | Email: ${user.EMAIL} | Durum: ${user.STATUS}`);
    });

    // Kontaklar
    console.log('\n📞 KONTAKLAR:');
    const [contacts] = await connection.execute('SELECT ID, NAME, COMPANY, EMAIL, STATUS FROM CONTACT ORDER BY ID');
    console.log(`Toplam: ${contacts.length} kontak`);
    contacts.forEach(contact => {
      console.log(`  ID: ${contact.ID} | İsim: ${contact.NAME} | Şirket: ${contact.COMPANY} | Email: ${contact.EMAIL}`);
    });

    // Görevler
    console.log('\n📋 GÖREVLER:');
    const [tasks] = await connection.execute('SELECT ID, NOTE, STATUS, USERID FROM TASK ORDER BY ID');
    console.log(`Toplam: ${tasks.length} görev`);
    tasks.forEach(task => {
      const notePreview = task.NOTE ? task.NOTE.substring(0, 50) + (task.NOTE.length > 50 ? '...' : '') : 'Boş';
      console.log(`  ID: ${task.ID} | Not: ${notePreview} | Durum: ${task.STATUS} | Kullanıcı: ${task.USERID}`);
    });

    // Fırsatlar
    console.log('\n💼 FIRSATLAR:');
    const [opportunities] = await connection.execute('SELECT ID, NAME, STAGE, VALUE FROM OPPORTUNITY ORDER BY ID');
    console.log(`Toplam: ${opportunities.length} fırsat`);
    opportunities.forEach(opp => {
      console.log(`  ID: ${opp.ID} | İsim: ${opp.NAME} | Aşama: ${opp.STAGE} | Değer: ${opp.VALUE}`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

checkDatabaseStatus();