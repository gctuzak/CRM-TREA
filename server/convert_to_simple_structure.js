const fs = require('fs');

function convertToSimpleStructure() {
  console.log('🔄 Orijinal backup dosyası basit yapıya dönüştürülüyor...');
  
  const originalFile = '../mydatabase_backup.sql';
  const convertedFile = './mydatabase_backup_simple.sql';
  
  if (!fs.existsSync(originalFile)) {
    console.error(`❌ ${originalFile} dosyası bulunamadı!`);
    return false;
  }

  let content = fs.readFileSync(originalFile, 'utf8');
  
  console.log('  - Charset ayarları düzeltiliyor...');
  // Charset değişiklikleri
  content = content
    .replace(/utf8mb3/g, 'utf8mb4')
    .replace(/utf8mb3_turkish_ci/g, 'utf8mb4_unicode_ci')
    .replace(/latin1(?!_)/g, 'utf8mb4')
    .replace(/utf8_general_ci/g, 'utf8mb4_unicode_ci')
    .replace(/latin1_swedish_ci/g, 'utf8mb4_unicode_ci')
    .replace(/DEFAULT CHARSET=latin1/g, 'DEFAULT CHARSET=utf8mb4')
    .replace(/DEFAULT CHARSET=utf8mb3/g, 'DEFAULT CHARSET=utf8mb4')
    .replace(/COLLATE=latin1_swedish_ci/g, 'COLLATE=utf8mb4_unicode_ci')
    .replace(/COLLATE=utf8_general_ci/g, 'COLLATE=utf8mb4_unicode_ci');

  console.log('  - CONTACT tablosu basit yapıya dönüştürülüyor...');
  
  // CONTACT tablosunu basit yapıya dönüştür
  const contactTableRegex = /CREATE TABLE `CONTACT` \(([\s\S]*?)\) ENGINE=[^;]+;/;
  const contactMatch = content.match(contactTableRegex);
  
  if (contactMatch) {
    const newContactTable = `CREATE TABLE \`CONTACT\` (
  \`ID\` int NOT NULL AUTO_INCREMENT,
  \`NAME\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  \`EMAIL\` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`PHONE\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`COMPANY\` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`POSITION\` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`ADDRESS\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  \`NOTES\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  \`STATUS\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  \`CREATED_AT\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`UPDATED_AT\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`ID\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;`;
    
    content = content.replace(contactTableRegex, newContactTable);
  }

  console.log('  - CONTACT verilerini basitleştiriliyor...');
  
  // CONTACT INSERT verilerini basit hale getir - sadece birkaç örnek kayıt ekle
  const contactInsertRegex = /INSERT INTO `CONTACT` VALUES[\s\S]*?(?=UNLOCK TABLES;)/;
  
  const sampleContacts = `/*!40000 ALTER TABLE \`CONTACT\` DISABLE KEYS */;
INSERT INTO \`CONTACT\` VALUES 
(1,'Ferhat ÖZDABAKOĞLU','ferhat@example.com','+905551234567','ACIBADEM PROJE YÖNETİMİ','Elektrik Mühendisi','İstanbul','Proje yöneticisi','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(2,'ACIBADEM PROJE YÖNETİMİ','info@acibadem.com','+902121234567','','','Büyükdere Cad. No:40 İstanbul','Sağlık kurumu','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(3,'Dilek Metin','dilek@example.com','+905551234568','ACIBADEM PROJE YÖNETİMİ','Proje Müdürü','İstanbul','','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(4,'Osman Şenovalı','osman@example.com','+905551234569','ARSHAN YAPI İNŞAAT','Genel Müdür','İstanbul','','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(5,'Cengiz Türe','cengiz@example.com','+905551234570','3S KALE GAYRİMENKUL','Proje Müdürü','İstanbul Bahçelievler','','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(6,'Murat Kılıç','murat@example.com','+905551234571','BNMA İNŞAAT','','İstanbul Şişli','','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(7,'Mehmet Eymen YAZICI','mehmet@example.com','+905551234572','BNMA İNŞAAT','Satınalma','İstanbul Şişli','','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(8,'İslam Aydın','islam@example.com','+905551234573','A&C İNŞAAT DEKORASYON','Şirket Sahibi','İstanbul Küçükçekmece','','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(9,'Yavuz DİNÇ','yavuz@example.com','+905551234574','DOST İNŞAAT','İdari ve Teknik İşler Sorumlusu','İstanbul Beykoz','','active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(10,'Ahmet Aykut EROL','ahmet@example.com','+905551234575','AYKUTEROL DESIGN','Genel Müdür','İstanbul Beyoğlu','','active','2025-08-07 10:00:00','2025-08-07 10:00:00');
/*!40000 ALTER TABLE \`CONTACT\` ENABLE KEYS */`;
  
  content = content.replace(contactInsertRegex, sampleContacts);

  console.log('  - USER tablosu basit yapıya dönüştürülüyor...');
  
  // USER tablosunu basit yapıya dönüştür
  const userTableRegex = /CREATE TABLE `USER` \(([\s\S]*?)\) ENGINE=[^;]+;/;
  const userMatch = content.match(userTableRegex);
  
  if (userMatch) {
    const newUserTable = `CREATE TABLE \`USER\` (
  \`ID\` int NOT NULL AUTO_INCREMENT,
  \`NAME\` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  \`EMAIL\` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`PASSWORD\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  \`KEYP\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`PERMISSION\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  \`CALENDARFILTER\` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`ORGANIZATION\` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`ORID\` int DEFAULT NULL,
  \`CONTACTID\` int DEFAULT NULL,
  \`STATUS\` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  \`ROLE\` enum('admin','user','manager') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  \`PHONE\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`DEPARTMENT_ID\` int DEFAULT NULL,
  \`DATETIMEDEL\` date DEFAULT NULL,
  \`STAMP\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`LAST_LOGIN\` date DEFAULT NULL,
  \`CREATED_DATE\` date DEFAULT NULL,
  \`UPDATED_DATE\` date DEFAULT NULL,
  PRIMARY KEY (\`ID\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;`;
    
    content = content.replace(userTableRegex, newUserTable);
  }
  
  console.log('  - USER verilerini basitleştiriliyor...');
  
  // USER INSERT verilerini basit hale getir
  const userInsertRegex = /INSERT INTO `USER` VALUES[\s\S]*?(?=UNLOCK TABLES;)/;
  
  const sampleUsers = `/*!40000 ALTER TABLE \`USER\` DISABLE KEYS */;
INSERT INTO \`USER\` VALUES 
(1,'Admin User','admin@example.com','$2b$10$rOvHPGkwxAKFzLJHOTlHOeRYjYgOrw5/CXZC4OQHEuuQiOHG6crTS',NULL,NULL,NULL,NULL,NULL,NULL,'active','admin',NULL,NULL,NULL,'2025-08-07 10:00:00',NULL,NULL,NULL),
(2,'Test User','test@example.com','$2b$10$rOvHPGkwxAKFzLJHOTlHOeRYjYgOrw5/CXZC4OQHEuuQiOHG6crTS',NULL,NULL,NULL,NULL,NULL,NULL,'active','user',NULL,NULL,NULL,'2025-08-07 10:00:00',NULL,NULL,NULL),
(3,'Ahmet Yılmaz','ahmet@example.com','$2b$10$rOvHPGkwxAKFzLJHOTlHOeRYjYgOrw5/CXZC4OQHEuuQiOHG6crTS',NULL,NULL,NULL,NULL,NULL,NULL,'active','user',NULL,NULL,NULL,'2025-08-07 10:00:00',NULL,NULL,NULL),
(4,'Mehmet Özkan','mehmet@example.com','$2b$10$rOvHPGkwxAKFzLJHOTlHOeRYjYgOrw5/CXZC4OQHEuuQiOHG6crTS',NULL,NULL,NULL,NULL,NULL,NULL,'active','manager',NULL,NULL,NULL,'2025-08-07 10:00:00',NULL,NULL,NULL),
(5,'Ayşe Güler','ayse@example.com','$2b$10$rOvHPGkwxAKFzLJHOTlHOeRYjYgOrw5/CXZC4OQHEuuQiOHG6crTS',NULL,NULL,NULL,NULL,NULL,NULL,'active','user',NULL,NULL,NULL,'2025-08-07 10:00:00',NULL,NULL,NULL);
/*!40000 ALTER TABLE \`USER\` ENABLE KEYS */`;
  
  content = content.replace(userInsertRegex, sampleUsers);

  console.log('  - TASK tablosu basit yapıya dönüştürülüyor...');
  
  // TASK tablosunu basit yapıya dönüştür
  const taskTableRegex = /CREATE TABLE `TASK` \(([\s\S]*?)\) ENGINE=[^;]+;/;
  const taskMatch = content.match(taskTableRegex);
  
  if (taskMatch) {
    const newTaskTable = `CREATE TABLE \`TASK\` (
  \`ID\` int NOT NULL AUTO_INCREMENT,
  \`USERID\` int NOT NULL,
  \`DATETIME\` datetime DEFAULT NULL,
  \`DATETIMEDUE\` datetime DEFAULT NULL,
  \`NOTE\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  \`STATUS\` enum('In progress','New','Completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  \`TYPEID\` int NOT NULL DEFAULT '0',
  \`CONTACTID\` int DEFAULT NULL,
  \`OPPORTUNITYID\` int NOT NULL DEFAULT '0',
  \`LEADID\` int NOT NULL DEFAULT '0',
  \`JOBID\` int NOT NULL DEFAULT '0',
  \`ORID\` int NOT NULL,
  \`DATETIMEEDIT\` datetime DEFAULT NULL,
  \`USERIDEDIT\` int NOT NULL DEFAULT '0',
  \`PARENTTASKID\` int NOT NULL DEFAULT '0',
  \`RECUR\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`RECURDUEDATE\` datetime DEFAULT NULL,
  \`GOOGLETASKID\` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`STAMP\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`ID\`,\`ORID\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;`;
    
    content = content.replace(taskTableRegex, newTaskTable);
  }
  
  console.log('  - TASK verilerini basitleştiriliyor...');
  
  // TASK INSERT verilerini basit hale getir
  const taskInsertRegex = /INSERT INTO `TASK` VALUES[\s\S]*?(?=UNLOCK TABLES;)/;
  
  const sampleTasks = `/*!40000 ALTER TABLE \`TASK\` DISABLE KEYS */;
INSERT INTO \`TASK\` VALUES 
(1,1,'2025-08-07 10:00:00','2025-08-10 17:00:00','Müşteri görüşmesi planla','New',0,1,0,0,0,1001,'2025-08-07 10:00:00',1,0,NULL,NULL,NULL,'2025-08-07 10:00:00'),
(2,2,'2025-08-07 11:00:00','2025-08-12 17:00:00','Teklif hazırla','In progress',0,2,0,0,0,1002,'2025-08-07 11:00:00',2,0,NULL,NULL,NULL,'2025-08-07 11:00:00'),
(3,3,'2025-08-07 12:00:00','2025-08-15 17:00:00','Teknik toplantı','New',0,3,0,0,0,1003,'2025-08-07 12:00:00',3,0,NULL,NULL,NULL,'2025-08-07 12:00:00'),
(4,1,'2025-08-07 13:00:00','2025-08-20 17:00:00','Proje sunumu hazırla','New',0,4,0,0,0,1004,'2025-08-07 13:00:00',1,0,NULL,NULL,NULL,'2025-08-07 13:00:00'),
(5,2,'2025-08-07 14:00:00','2025-08-25 17:00:00','Müşteri ziyareti','New',0,5,0,0,0,1005,'2025-08-07 14:00:00',2,0,NULL,NULL,NULL,'2025-08-07 14:00:00');
/*!40000 ALTER TABLE \`TASK\` ENABLE KEYS */`;
  
  content = content.replace(taskInsertRegex, sampleTasks);

  console.log('  - OPPORTUNITY tablosu basit yapıya dönüştürülüyor...');
  
  // OPPORTUNITY tablosunu basit yapıya dönüştür
  const opportunityTableRegex = /CREATE TABLE `OPPORTUNITY` \(([\s\S]*?)\) ENGINE=[^;]+;/;
  const opportunityMatch = content.match(opportunityTableRegex);
  
  if (opportunityMatch) {
    const newOpportunityTable = `CREATE TABLE \`OPPORTUNITY\` (
  \`ID\` int NOT NULL AUTO_INCREMENT,
  \`NAME\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  \`DESCRIPTION\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  \`VALUE\` decimal(15,2) DEFAULT NULL,
  \`STAGE\` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`PROBABILITY\` int DEFAULT NULL,
  \`EXPECTED_CLOSE_DATE\` date DEFAULT NULL,
  \`CONTACT_ID\` int DEFAULT NULL,
  \`USER_ID\` int DEFAULT NULL,
  \`STATUS\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  \`CREATED_AT\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`UPDATED_AT\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`ID\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;`;
    
    content = content.replace(opportunityTableRegex, newOpportunityTable);
  }
  
  console.log('  - OPPORTUNITY verilerini basitleştiriliyor...');
  
  // OPPORTUNITY INSERT verilerini basit hale getir
  const opportunityInsertRegex = /INSERT INTO `OPPORTUNITY` VALUES[\s\S]*?(?=UNLOCK TABLES;)/;
  
  const sampleOpportunities = `/*!40000 ALTER TABLE \`OPPORTUNITY\` DISABLE KEYS */;
INSERT INTO \`OPPORTUNITY\` VALUES 
(1,'ACIBADEM Hastane Projesi','Hastane için kapsamlı inşaat projesi',2500000.00,'Proposal',75,'2025-12-31',1,1,'active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(2,'Arshan Yapı Konut Projesi','Lüks konut projesi için malzeme tedariki',1800000.00,'Negotiation',60,'2025-11-30',4,2,'active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(3,'3S Kale Ofis Binası','Modern ofis binası inşaatı',3200000.00,'Qualified',80,'2025-10-15',5,3,'active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(4,'BNMA Fabrika Projesi','Endüstriyel tesis inşaatı',4500000.00,'Proposal',45,'2026-03-31',6,1,'active','2025-08-07 10:00:00','2025-08-07 10:00:00'),
(5,'A&C Dekorasyon İşi','İç mekan dekorasyon projesi',850000.00,'Closed Won',100,'2025-09-30',8,2,'active','2025-08-07 10:00:00','2025-08-07 10:00:00');
/*!40000 ALTER TABLE \`OPPORTUNITY\` ENABLE KEYS */`;
  
  content = content.replace(opportunityInsertRegex, sampleOpportunities);

  console.log('  - MyISAM tabloları InnoDB\'ye çevriliyor...');
  content = content.replace(/ENGINE=MyISAM/g, 'ENGINE=InnoDB');

  console.log('  - Tüm problematik index\'ler kaldırılıyor...');
  // Tüm problematik index'leri kaldır
  content = content
    .replace(/,\s*UNIQUE KEY[^,)]+/g, '')
    .replace(/,\s*KEY[^,)]+/g, '')
    .replace(/UNIQUE KEY[^,)]+,?\s*/g, '')
    .replace(/KEY[^,)]+,?\s*/g, '');

  console.log('  - Çift virgül sorunları düzeltiliyor...');
  content = content
    .replace(/,,+/g, ',')
    .replace(/,\s*\)/g, ')')
    .replace(/,\s*,/g, ',')
    .replace(/PRIMARY \)/g, 'PRIMARY KEY (`ID`)');

  console.log('  - ROW_FORMAT ayarları ekleniyor...');
  content = content.replace(
    /(ENGINE=InnoDB[^;]*)(;)/g, 
    '$1 ROW_FORMAT=DYNAMIC$2'
  );
  
  console.log('  - Çift ROW_FORMAT sorunları düzeltiliyor...');
  content = content.replace(/ROW_FORMAT=DYNAMIC\s+ROW_FORMAT=DYNAMIC/g, 'ROW_FORMAT=DYNAMIC');

  console.log('  - Dönüştürülmüş dosya kaydediliyor...');
  fs.writeFileSync(convertedFile, content);
  
  console.log(`✅ Basit yapıya dönüştürülmüş dosya hazır: ${convertedFile}`);
  return convertedFile;
}

if (require.main === module) {
  convertToSimpleStructure();
}

module.exports = { convertToSimpleStructure };