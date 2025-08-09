const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = 'root';
const DB_PASS = 'rootpassword';
const DB_NAME = process.env.MYSQL_DATABASE || 'mydatabase';

async function findMySQLContainer() {
  try {
    console.log('🔍 MySQL Docker container aranıyor...');
    
    // Önce bilinen container isimlerini dene
    const knownNames = ['crm_mysql', 'mysql_migration', 'mysql'];
    
    for (const name of knownNames) {
      try {
        execSync(`docker ps --filter "name=${name}" --format "{{.Names}}"`, { encoding: 'utf8' });
        console.log(`✅ MySQL container bulundu: ${name}`);
        return name;
      } catch (e) {
        // Bu container yok, devam et
      }
    }
    
    // Genel arama yap
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

async function restoreSimpleBackup() {
  const container = await findMySQLContainer();
  if (!container) return false;

  const simpleBackupFile = './mydatabase_backup_clean.sql';
  
  if (!fs.existsSync(simpleBackupFile)) {
    console.error(`❌ ${simpleBackupFile} dosyası bulunamadı!`);
    return false;
  }

  try {
    console.log('🔄 Basit yapıya dönüştürülmüş backup dosyası yükleniyor...');
    
    // Önce veritabanını temizle
    console.log('🗑️ Mevcut veritabanı temizleniyor...');
    execSync(`docker exec ${container} mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
    
    // Dosyayı containera kopyala
    console.log('📁 Dosya containera kopyalanıyor...');
    execSync(`docker cp "${simpleBackupFile}" ${container}:/tmp/simple_backup.sql`);
    
    // Veritabanını geri yükle
    console.log('🔄 Veritabanı geri yükleniyor...');
    execSync(`docker exec ${container} bash -c "mysql -u${DB_USER} -p${DB_PASS} --default-character-set=utf8mb4 ${DB_NAME} < /tmp/simple_backup.sql"`);
    
    // Geçici dosyayı temizle
    execSync(`docker exec ${container} rm /tmp/simple_backup.sql`);
    
    console.log('✅ Basit yapıya dönüştürülmüş backup başarıyla yüklendi');
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
    console.log('🔤 Türkçe karakter testi:');
    const [turkishContacts] = await connection.execute('SELECT NAME FROM CONTACT WHERE NAME REGEXP "[çğıöşüÇĞIİÖŞÜ]" LIMIT 10');
    
    if (turkishContacts.length > 0) {
      turkishContacts.forEach(contact => {
        console.log(`  ✅ ${contact.NAME}`);
      });
    } else {
      console.log('  ⚠️ Türkçe karakterli kontak bulunamadı');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Veritabanı test hatası:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Basit Yapıya Dönüştürülmüş Backup Geri Yükleme\n');
  
  const success = await restoreSimpleBackup();
  if (success) {
    console.log('\n🧪 Veritabanı test ediliyor...');
    await testDatabase();
    console.log('\n🎉 İşlem tamamlandı!');
  }
}

main().catch(console.error);