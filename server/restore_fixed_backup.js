const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.MYSQL_USER || 'migration_user';
const DB_PASS = process.env.MYSQL_PASSWORD || 'migration_pass';
const DB_NAME = process.env.MYSQL_DATABASE || 'mydatabase';

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

async function restoreFixedBackup() {
  const container = await findMySQLContainer();
  if (!container) return false;

  const fixedBackupFile = './mydatabase_backup_final_fixed.sql';
  
  if (!fs.existsSync(fixedBackupFile)) {
    console.error(`❌ ${fixedBackupFile} dosyası bulunamadı!`);
    return false;
  }

  try {
    console.log('🔄 Düzeltilmiş backup dosyası yükleniyor...');
    
    // Önce veritabanını temizle
    console.log('🗑️ Mevcut veritabanı temizleniyor...');
    execSync(`docker exec ${container} mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
    
    // Dosyayı containera kopyala
    console.log('📁 Dosya containera kopyalanıyor...');
    execSync(`docker cp "${fixedBackupFile}" ${container}:/tmp/fixed_backup.sql`);
    
    // Veritabanını geri yükle
    console.log('🔄 Veritabanı geri yükleniyor...');
    execSync(`docker exec ${container} bash -c "mysql -u${DB_USER} -p${DB_PASS} --default-character-set=utf8mb4 ${DB_NAME} < /tmp/fixed_backup.sql"`);
    
    // Geçici dosyayı temizle
    execSync(`docker exec ${container} rm /tmp/fixed_backup.sql`);
    
    console.log('✅ Düzeltilmiş backup başarıyla yüklendi');
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
    const [turkishTest] = await connection.execute('SELECT NAME FROM USER WHERE NAME REGEXP "[çğıöşüÇĞIİÖŞÜ]" LIMIT 5');
    
    console.log('🔤 Türkçe karakter testi:');
    if (turkishTest.length > 0) {
      turkishTest.forEach(user => {
        console.log(`  ✅ ${user.NAME}`);
      });
    } else {
      console.log('  ⚠️ Türkçe karakterli kayıt bulunamadı');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Veritabanı test hatası:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Düzeltilmiş Backup Geri Yükleme\n');
  
  const success = await restoreFixedBackup();
  if (success) {
    console.log('\n🧪 Veritabanı test ediliyor...');
    await testDatabase();
    console.log('\n🎉 İşlem tamamlandı!');
  }
}

main().catch(console.error);