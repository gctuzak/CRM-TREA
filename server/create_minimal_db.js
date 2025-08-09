const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

const DB_HOST = 'localhost';
const DB_PORT = '3306';
const DB_USER = 'migration_user';
const DB_PASS = 'migration_pass';
const DB_NAME = 'mydatabase';

console.log('🔧 Minimal veritabanı yapısı oluşturucu');

async function findMySQLContainer() {
  try {
    const result = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
    const containers = result.trim().split('\n').filter(line => line.includes('mysql'));
    
    if (containers.length > 0) {
      console.log(`✅ MySQL container bulundu: ${containers[0]}`);
      return containers[0];
    }
  } catch (error) {
    console.log('❌ MySQL container bulunamadı:', error.message);
  }
  return null;
}

async function createMinimalDatabase() {
  const container = await findMySQLContainer();
  if (!container) return false;

  try {
    console.log('📁 SQL dosyası containera kopyalanıyor...');
    execSync(`docker cp minimal_schema.sql ${container}:/tmp/minimal_schema.sql`);
    
    console.log('🔄 Minimal veritabanı oluşturuluyor...');
    execSync(`docker exec ${container} bash -c "mysql -u${DB_USER} -p${DB_PASS} --default-character-set=utf8mb4 < /tmp/minimal_schema.sql"`);
    
    console.log('🧹 Geçici dosya temizleniyor...');
    execSync(`docker exec ${container} rm /tmp/minimal_schema.sql`);
    
    console.log('✅ Minimal veritabanı başarıyla oluşturuldu!');
    console.log('🔍 Test için: node database_restore.js test');
    
    return true;
  } catch (error) {
    console.error('❌ Veritabanı oluşturma hatası:', error.message);
    return false;
  }
}

createMinimalDatabase();