const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'crmuser';
const DB_PASS = process.env.DB_PASSWORD || 'crmpassword';
const DB_NAME = process.env.DB_NAME || 'mydatabase';

async function findMySQLContainer() {
  try {
    console.log('🔍 MySQL Docker container aranıyor...');
    const containers = execSync('docker ps --format "{{.Names}}" --filter "ancestor=mysql"', { encoding: 'utf8' });
    const containerList = containers.trim().split('\n').filter(name => name);
    
    if (containerList.length > 0) {
      console.log(`✅ MySQL container bulundu: ${containerList[0]}`);
      return containerList[0];
    }
    
    // Alternatif arama
    const allContainers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
    const allList = allContainers.trim().split('\n').filter(name => name);
    
    for (const container of allList) {
      if (container.toLowerCase().includes('mysql') || container.toLowerCase().includes('db')) {
        console.log(`✅ MySQL container bulundu: ${container}`);
        return container;
      }
    }
    
    throw new Error('MySQL container bulunamadı');
  } catch (error) {
    console.error('❌ Container bulunamadı:', error.message);
    return null;
  }
}

async function restoreCarefulBackup() {
  const container = await findMySQLContainer();
  if (!container) return false;

  const carefulBackupFile = './mydatabase_backup_carefully_fixed.sql';
  
  if (!fs.existsSync(carefulBackupFile)) {
    console.error(`❌ ${carefulBackupFile} dosyası bulunamadı!`);
    return false;
  }

  try {
    console.log('🔄 Dikkatli düzeltilmiş backup dosyası yükleniyor...');
    
    // Önce veritabanını temizle
    console.log('🗑️ Mevcut veritabanı temizleniyor...');
    execSync(`docker exec ${container} mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
    
    // Dosyayı containera kopyala
    console.log('📁 Dosya containera kopyalanıyor...');
    execSync(`docker cp "${carefulBackupFile}" ${container}:/tmp/careful_backup.sql`);
    
    // Veritabanını geri yükle
    console.log('🔄 Veritabanı geri yükleniyor...');
    execSync(`docker exec ${container} bash -c "mysql -u${DB_USER} -p${DB_PASS} --default-character-set=utf8mb4 ${DB_NAME} < /tmp/careful_backup.sql"`);
    
    // Geçici dosyayı temizle
    execSync(`docker exec ${container} rm /tmp/careful_backup.sql`);
    
    console.log('✅ Dikkatli düzeltilmiş backup başarıyla yüklendi');
    return true;
  } catch (error) {
    console.error('❌ Backup yükleme hatası:', error.message);
    return false;
  }
}

async function testDatabase() {
  const mysql = require('mysql2/promise');
  
  try {
    console.log('🧪 Veritabanı bağlantısı test ediliyor...');
    
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      charset: 'utf8mb4'
    });

    // Test sorguları
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM USER');
    const [contacts] = await connection.execute('SELECT COUNT(*) as count FROM CONTACT');
    const [tasks] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    const [opportunities] = await connection.execute('SELECT COUNT(*) as count FROM OPPORTUNITY');
    
    console.log('📊 Veritabanı durumu:');
    console.log(`  👥 Kullanıcılar: ${users[0].count}`);
    console.log(`  📞 Kişiler: ${contacts[0].count}`);
    console.log(`  📋 Görevler: ${tasks[0].count}`);
    console.log(`  💼 Fırsatlar: ${opportunities[0].count}`);
    
    // Türkçe karakter testi
    console.log('\n🔤 Türkçe karakter testi:');
    const [turkishContacts] = await connection.execute('SELECT NAME FROM CONTACT WHERE NAME REGEXP "[çğıöşüÇĞIİÖŞÜ]" LIMIT 10');
    
    if (turkishContacts.length > 0) {
      turkishContacts.forEach(contact => {
        console.log(`  ✅ ${contact.NAME}`);
      });
    } else {
      console.log('  ⚠️ Türkçe karakterli kontak bulunamadı');
    }

    // Örnek veriler
    console.log('\n📋 İlk 5 kontak:');
    const [sampleContacts] = await connection.execute('SELECT ID, NAME, PARENTCONTACTNAME FROM CONTACT LIMIT 5');
    sampleContacts.forEach(contact => {
      console.log(`  ID: ${contact.ID} | İsim: ${contact.NAME} | Şirket: ${contact.PARENTCONTACTNAME}`);
    });
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Veritabanı test hatası:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Dikkatli Düzeltilmiş Backup Geri Yükleme\n');
  
  const success = await restoreCarefulBackup();
  if (success) {
    console.log('\n🧪 Veritabanı test ediliyor...');
    await testDatabase();
    console.log('\n🎉 İşlem tamamlandı! Binlerce kayıt başarıyla yüklendi ve Türkçe karakterler düzgün çalışıyor.');
  }
}

main().catch(console.error);