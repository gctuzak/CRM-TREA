const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.MYSQL_USER || 'migration_user';
const DB_PASS = process.env.MYSQL_PASSWORD || 'migration_pass';
const DB_NAME = process.env.MYSQL_DATABASE || 'mydatabase';

// Docker container name (MySQL container'inin adini bulalim)
const DOCKER_CONTAINER = 'mysql'; // veya gercek container adi

async function findMySQLContainer() {
  try {
    console.log('🔍 MySQL Docker container araniyor...');
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
    
    throw new Error('MySQL container bulunamadi');
  } catch (error) {
    console.error('❌ Container bulunamadi:', error.message);
    console.log('📋 Mevcut containerlar:');
    try {
      const containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
      console.log(containers);
    } catch (e) {
      console.log('Docker calisimiyor olabilir');
    }
    return null;
  }
}

async function createBackup() {
  const container = await findMySQLContainer();
  if (!container) return false;

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `mydatabase_backup_${timestamp}.sql`;
    
    console.log('💾 Mevcut veritabaninin yedegi aliniyor...');
    
    const dumpCommand = `docker exec ${container} mysqldump -u${DB_USER} -p${DB_PASS} --default-character-set=utf8mb4 --single-transaction --routines --triggers ${DB_NAME}`;
    
    const backupData = execSync(dumpCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 });
    
    fs.writeFileSync(backupFile, backupData);
    console.log(`✅ Yedek olusturuldu: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Yedek alma hatasi:', error.message);
    return false;
  }
}

async function restoreFromBackup(backupFile) {
  const container = await findMySQLContainer();
  if (!container) return false;

  try {
    console.log(`🔄 ${backupFile} dosyasi geri yukleniyor...`);
    
    // Dosyayi containera kopyala
    console.log('📁 Dosya containera kopyalaniyor...');
    execSync(`docker cp "${backupFile}" ${container}:/tmp/restore.sql`);
    
    // Veritabanini geri yukle
    console.log('🔄 Veritabani geri yukleniyor...');
    
    execSync(`docker exec ${container} bash -c "mysql -u${DB_USER} -p${DB_PASS} --default-character-set=utf8mb4 ${DB_NAME} < /tmp/restore.sql"`, { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    // Gecici dosyayi temizle
    execSync(`docker exec ${container} rm /tmp/restore.sql`);
    
    console.log('✅ Veritabani basariyla geri yuklendi');
    return true;
  } catch (error) {
    console.error('❌ Geri yukleme hatasi:', error.message);
    return false;
  }
}

async function restoreOriginalBackup() {
  const container = await findMySQLContainer();
  if (!container) return false;

  const originalBackupFile = '../mydatabase_backup.sql';
  
  if (!fs.existsSync(originalBackupFile)) {
    console.error(`❌ ${originalBackupFile} dosyasi bulunamadi!`);
    return false;
  }

  try {
    // Önce AUTO_INCREMENT sorunlarını düzelt
    console.log('🔧 AUTO_INCREMENT sorunları düzeltiliyor...');
    execSync('node fix_backup_autoincrement.js', { cwd: __dirname });
    
    const fixedBackupFile = './mydatabase_backup_fixed.sql';
    console.log(`🔄 Düzeltilmiş yedek dosyası yükleniyor: ${fixedBackupFile}`);
    
    // Once veritabanini temizle
    console.log('🗑️ Mevcut veritabani temizleniyor...');
    execSync(`docker exec ${container} mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
    
    // Dosyayi containera kopyala
    console.log('📁 Dosya containera kopyalaniyor...');
    execSync(`docker cp "${fixedBackupFile}" ${container}:/tmp/original_backup.sql`);
    
    // Charset'i duzelt - once dosyayi oku, duzelt ve geri yaz
    console.log('🔧 Charset ayarlari duzeltiliyor...');
    let backupContent = fs.readFileSync(fixedBackupFile, 'utf8');
    
    // Charset degisiklikleri ve index sorunlarini coz
    console.log('  - Charset ayarlari degistiriliyor...');
    backupContent = backupContent
      .replace(/utf8mb3/g, 'utf8mb4')
      .replace(/latin1(?!_)/g, 'utf8mb4')
      .replace(/utf8_general_ci/g, 'utf8mb4_unicode_ci')
      .replace(/latin1_swedish_ci/g, 'utf8mb4_unicode_ci')
      .replace(/DEFAULT CHARSET=latin1/g, 'DEFAULT CHARSET=utf8mb4')
      .replace(/DEFAULT CHARSET=utf8mb3/g, 'DEFAULT CHARSET=utf8mb4')
      .replace(/COLLATE=latin1_swedish_ci/g, 'COLLATE=utf8mb4_unicode_ci')
      .replace(/COLLATE=utf8_general_ci/g, 'COLLATE=utf8mb4_unicode_ci');
    
    console.log('  - Index uzunluk sorunlari duzeltiliyor...');
    // Tum VARCHAR alanlarini guvenli uzunluklara getir
    backupContent = backupContent
      .replace(/VARCHAR\(255\)/g, 'VARCHAR(191)')
      .replace(/VARCHAR\(250\)/g, 'VARCHAR(191)')
      .replace(/VARCHAR\(200\)/g, 'VARCHAR(150)')
      .replace(/VARCHAR\(150\)/g, 'VARCHAR(120)')
      .replace(/VARCHAR\(130\)/g, 'VARCHAR(100)')
      .replace(/VARCHAR\(100\)/g, 'VARCHAR(80)')
      .replace(/VARCHAR\(70\)/g, 'VARCHAR(60)')
      .replace(/VARCHAR\(50\)/g, 'VARCHAR(40)');
    
    // Index prefix uzunluklarini duzelt
    backupContent = backupContent
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(255\)\)/g, 'KEY `$1` (`$2`(100))')
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(250\)\)/g, 'KEY `$1` (`$2`(100))')
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(200\)\)/g, 'KEY `$1` (`$2`(100))')
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(150\)\)/g, 'KEY `$1` (`$2`(100))')
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(130\)\)/g, 'KEY `$1` (`$2`(100))')
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(100\)\)/g, 'KEY `$1` (`$2`(80))')
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(70\)\)/g, 'KEY `$1` (`$2`(60))')
      .replace(/KEY `([^`]+)` \(`([^`]+)`\(50\)\)/g, 'KEY `$1` (`$2`(40))');
    
    console.log('  - Unique index sorunlari duzeltiliyor...');
    // Sadece VARCHAR alanlari icin prefix ekle, diger index'leri oldugu gibi birak
    console.log('  - VARCHAR index\'leri duzeltiliyor...');
    
    // Sadece NAME alani icin prefix ekle (VARCHAR oldugunu biliyoruz)
    backupContent = backupContent
      .replace(/UNIQUE KEY `NAME` \(`NAME`,`ORID`\)/g, 'UNIQUE KEY `NAME` (`NAME`(100),`ORID`)')
      .replace(/KEY `NAME` \(`NAME`,`ORID`\)/g, 'KEY `NAME` (`NAME`(100),`ORID`)')
      .replace(/KEY `NAME` \(`NAME`\)/g, 'KEY `NAME` (`NAME`(100))')
      // Diger VARCHAR alanlari icin de
      .replace(/UNIQUE KEY `([^`]+)` \(`TITLE`\)/g, 'UNIQUE KEY `$1` (`TITLE`(100))')
      .replace(/KEY `([^`]+)` \(`TITLE`\)/g, 'KEY `$1` (`TITLE`(100))')
      .replace(/UNIQUE KEY `([^`]+)` \(`EMAIL`\)/g, 'UNIQUE KEY `$1` (`EMAIL`(100))')
      .replace(/KEY `([^`]+)` \(`EMAIL`\)/g, 'KEY `$1` (`EMAIL`(100))');
    
    console.log('  - MyISAM tablolari InnoDB\'ye cevriliyor...');
    // MyISAM tablolarini InnoDB'ye cevir (utf8mb4 desteği daha iyi)
    backupContent = backupContent.replace(/ENGINE=MyISAM/g, 'ENGINE=InnoDB');
    
    console.log('  - ROW_FORMAT ayarlari ekleniyor...');
    // Tablolara ROW_FORMAT=DYNAMIC ekle (utf8mb4 icin gerekli)
    backupContent = backupContent.replace(
      /(ENGINE=InnoDB[^;]*)(;)/g, 
      '$1 ROW_FORMAT=DYNAMIC$2'
    );
    
    console.log('  - Sadece problematik UNIQUE KEY\'ler kaldiriliyor...');
    // Sadece NAME ile ilgili problematik index'leri kaldir, PRIMARY KEY'leri koru
    backupContent = backupContent
      .replace(/,\s*UNIQUE KEY `NAME` \(`NAME`,`ORID`\)/g, '')
      .replace(/,\s*KEY `NAME` \(`NAME`,`ORID`\)/g, '')
      .replace(/,\s*KEY `NAME` \(`NAME`\)/g, '');
    
    console.log('  - AUTO_INCREMENT alanlari icin PRIMARY KEY kontrol ediliyor...');
    // AUTO_INCREMENT alanlari icin PRIMARY KEY oldugunu garanti et
    const lines = backupContent.split('\n');
    let inTable = false;
    let tableName = '';
    let autoIncrementField = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('CREATE TABLE')) {
        inTable = true;
        tableName = line.match(/CREATE TABLE `([^`]+)`/)?.[1] || '';
        autoIncrementField = '';
      }
      
      if (inTable && line.includes('AUTO_INCREMENT')) {
        const fieldMatch = line.match(/`([^`]+)`.*AUTO_INCREMENT/);
        if (fieldMatch) {
          autoIncrementField = fieldMatch[1];
        }
      }
      
      if (inTable && line.includes(') ENGINE=')) {
        // Tablo sonu, PRIMARY KEY kontrolu yap
        if (autoIncrementField && !backupContent.includes(`PRIMARY KEY (\`${autoIncrementField}\`)`)) {
          // PRIMARY KEY ekle
          lines[i] = line.replace(
            ') ENGINE=',
            `,\n  PRIMARY KEY (\`${autoIncrementField}\`)\n) ENGINE=`
          );
        }
        inTable = false;
      }
    }
    
    backupContent = lines.join('\n');
    
    // Duzeltilmis dosyayi gecici olarak kaydet
    const tempFile = 'temp_backup_fixed.sql';
    fs.writeFileSync(tempFile, backupContent);
    
    // Duzeltilmis dosyayi containera kopyala
    execSync(`docker cp "${tempFile}" ${container}:/tmp/original_backup.sql`);
    
    // Gecici dosyayi sil
    fs.unlinkSync(tempFile);
    
    // Veritabanini geri yukle
    console.log('🔄 Veritabani geri yukleniyor...');
    execSync(`docker exec ${container} bash -c "mysql -u${DB_USER} -p${DB_PASS} --default-character-set=utf8mb4 ${DB_NAME} < /tmp/original_backup.sql"`);
    
    // Gecici dosyayi temizle
    execSync(`docker exec ${container} rm /tmp/original_backup.sql`);
    
    console.log('✅ Orijinal yedek basariyla yuklendi');
    return true;
  } catch (error) {
    console.error('❌ Orijinal yedek yukleme hatasi:', error.message);
    return false;
  }
}

async function testDatabase() {
  const mysql = require('mysql2/promise');
  
  try {
    console.log('🧪 Veritabani baglantisi test ediliyor...');
    
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      charset: 'utf8mb4'
    });

    // Test sorgulari
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM USER');
    const [contacts] = await connection.execute('SELECT COUNT(*) as count FROM CONTACT');
    const [tasks] = await connection.execute('SELECT COUNT(*) as count FROM TASK');
    
    console.log('📊 Veritabani durumu:');
    console.log(`  👥 Kullanicilar: ${users[0].count}`);
    console.log(`  📞 Kisiler: ${contacts[0].count}`);
    console.log(`  📋 Gorevler: ${tasks[0].count}`);
    
    // Turkce karakter testi
    const [turkishTest] = await connection.execute('SELECT NAME FROM USER WHERE NAME LIKE "%ü%" OR NAME LIKE "%ğ%" OR NAME LIKE "%ş%" OR NAME LIKE "%ı%" OR NAME LIKE "%ö%" OR NAME LIKE "%ç%" LIMIT 3');
    
    console.log('🔤 Turkce karakter testi:');
    if (turkishTest.length > 0) {
      turkishTest.forEach(user => {
        console.log(`  ✅ ${user.NAME}`);
      });
    } else {
      console.log('  ⚠️ Turkce karakterli kayit bulunamadi');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Veritabani test hatasi:', error.message);
    return false;
  }
}

// Ana fonksiyon
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🚀 Veritabani Yedekleme ve Geri Yukleme Araci\n');

  switch (command) {
    case 'backup':
      console.log('💾 Yedek alma islemi baslatiliyor...\n');
      const backupFile = await createBackup();
      if (backupFile) {
        console.log(`\n🎉 Yedek basariyla olusturuldu: ${backupFile}`);
      }
      break;

    case 'restore-original':
      console.log('🔄 Orijinal yedek geri yukleme islemi baslatiliyor...\n');
      
      // Once mevcut durumun yedegini al
      const currentBackup = await createBackup();
      if (!currentBackup) {
        console.log('❌ Mevcut yedek alinamadi, islem iptal ediliyor');
        return;
      }
      
      // Orijinal yedegi geri yukle
      const success = await restoreOriginalBackup();
      if (success) {
        console.log('\n🧪 Veritabani test ediliyor...');
        const testResult = await testDatabase();
        
        if (testResult) {
          console.log('\n🎉 Orijinal yedek basariyla yuklendi ve test edildi!');
          console.log(`💾 Onceki durum yedegi: ${currentBackup}`);
        } else {
          console.log('\n❌ Test basarisiz, onceki duruma geri donuluyor...');
          await restoreFromBackup(currentBackup);
        }
      }
      break;

    case 'restore':
      const restoreFile = args[1];
      if (!restoreFile) {
        console.log('❌ Geri yuklenecek dosya belirtilmedi');
        console.log('Kullanim: node database_restore.js restore <dosya_adi>');
        return;
      }
      
      console.log(`🔄 ${restoreFile} geri yukleme islemi baslatiliyor...\n`);
      const restoreSuccess = await restoreFromBackup(restoreFile);
      if (restoreSuccess) {
        await testDatabase();
      }
      break;

    case 'test':
      console.log('🧪 Veritabani test ediliyor...\n');
      await testDatabase();
      break;

    default:
      console.log('📋 Kullanim:');
      console.log('  node database_restore.js backup                    # Mevcut durumun yedegini al');
      console.log('  node database_restore.js restore-original          # mydatabase_backup.sql dosyasini yukle');
      console.log('  node database_restore.js restore <dosya_adi>        # Belirtilen dosyayi geri yukle');
      console.log('  node database_restore.js test                      # Veritabanini test et');
      break;
  }
}

main().catch(console.error);