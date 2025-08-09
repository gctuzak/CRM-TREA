# MySQL Veritabanı Bağlantı Bilgileri

## 🐳 Docker Konteyner Bilgileri

### Konteyner Detayları
- **Konteyner Adı**: `mysql_migration`
- **Docker Image**: `mysql:8.0`
- **Restart Policy**: `unless-stopped`
- **Network**: `migration_network`
- **Volume**: `mysql_migration_data`

### Port Yapılandırması
- **MySQL Port**: `3306` (Host:Container)
- **Erişim**: `localhost:3306`

## 🔐 Kullanıcı Hesapları ve Şifreler

### Root Kullanıcı
- **Kullanıcı Adı**: `root`
- **Şifre**: `migration123`
- **Yetki**: Tam yönetici erişimi
- **Kullanım**: Sistem yönetimi, backup/restore işlemleri

### Migration Kullanıcı
- **Kullanıcı Adı**: `migration_user`
- **Şifre**: `migration_pass`
- **Yetki**: Veritabanı işlemleri
- **Kullanım**: Uygulama bağlantıları

## 🗄️ Veritabanı Bilgileri

### Ana Veritabanı
- **Veritabanı Adı**: `mydatabase`
- **Karakter Seti**: `utf8mb3`
- **Collation**: `utf8mb3_turkish_ci`
- **Engine**: `InnoDB` (çoğu tablo)
- **Tablo Sayısı**: 30

### Tablo Listesi ve Kayıt Sayıları
| Tablo Adı | Kayıt Sayısı | Açıklama |
|-----------|-------------|----------|
| CONTACT | 3,688 | Ana iletişim kayıtları |
| CONTACTEMAIL | 2,827 | E-posta adresleri |
| CONTACTPHONE | 3,406 | Telefon numaraları |
| CONTACTFIELD | - | İletişim alanları tanımları |
| CONTACTFIELDPRESET | - | Alan ön tanımlı değerleri |
| CONTACTFIELDVALUE | 10,408 | Özel alan değerleri |
| DEPARTMENT | 4 | Departman bilgileri |
| EVENT | - | Etkinlik kayıtları |
| EVENTGUEST | - | Etkinlik katılımcıları |
| FILTER | - | Filtre tanımları |
| JOB | 1,659 | İş kayıtları |
| JOBSTATUSTYPE | - | İş durum tipleri |
| LEAD | - | Potansiyel müşteri kayıtları |
| LOGIN_HISTORY | - | Giriş geçmişi |
| OPPORTUNITY | 2,667 | Fırsat kayıtları |
| OPPORTUNITYPRODUCT | - | Fırsat ürünleri |
| ORGANIZATIONTYPE | - | Organizasyon tipleri |
| PRICEDISCOUNT | - | Fiyat indirimleri |
| PRICELIST | - | Fiyat listeleri |
| PRICELISTDETAIL | - | Fiyat listesi detayları |
| REPORT | - | Rapor tanımları |
| STATUSTYPE | - | Durum tipleri |
| TASK | 3,813 | Görev kayıtları |
| TASKARCHIVE | - | Arşivlenmiş görevler |
| TASKTYPE | - | Görev tipleri |
| TASKUSER | - | Görev kullanıcı atamaları |
| TASKUSERARCHIVE | - | Arşivlenmiş görev atamaları |
| USER | 9 | Kullanıcı hesapları |
| USERCODES | - | Kullanıcı kodları |
| USEREMAIL | - | Kullanıcı e-postaları |

## 🔗 Bağlantı Bilgileri

### Komut Satırı Bağlantısı
```bash
# Root kullanıcı ile bağlantı
docker exec -it mysql_migration mysql -u root -p'migration123' mydatabase

# UTF-8 karakter desteği ile bağlantı
docker exec -it mysql_migration mysql -u root -p'migration123' --default-character-set=utf8mb3 mydatabase

# Migration kullanıcı ile bağlantı
docker exec -it mysql_migration mysql -u migration_user -p'migration_pass' mydatabase
```

### Uygulama Bağlantı String'leri

#### PHP (PDO)
```php
$dsn = "mysql:host=localhost;port=3306;dbname=mydatabase;charset=utf8mb3";
$username = "migration_user";
$password = "migration_pass";
$options = [
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb3 COLLATE utf8mb3_turkish_ci"
];
```

#### Python (mysql-connector-python)
```python
import mysql.connector

config = {
    'host': 'localhost',
    'port': 3306,
    'user': 'migration_user',
    'password': 'migration_pass',
    'database': 'mydatabase',
    'charset': 'utf8mb3',
    'collation': 'utf8mb3_turkish_ci'
}
```

#### Node.js (mysql2)
```javascript
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'migration_user',
    password: 'migration_pass',
    database: 'mydatabase',
    charset: 'utf8mb3'
});
```

#### Java (JDBC)
```java
String url = "jdbc:mysql://localhost:3306/mydatabase?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC";
String username = "migration_user";
String password = "migration_pass";
```

#### .NET (MySql.Data)
```csharp
string connectionString = "Server=localhost;Port=3306;Database=mydatabase;Uid=migration_user;Pwd=migration_pass;CharSet=utf8mb3;";
```

## 🛠️ Docker Yönetim Komutları

### Konteyner Yönetimi
```bash
# Konteyner durumunu kontrol et
docker ps | grep mysql_migration

# Konteyner loglarını görüntüle
docker logs mysql_migration

# Konteyner başlat
docker start mysql_migration

# Konteyner durdur
docker stop mysql_migration

# Konteyner yeniden başlat
docker restart mysql_migration

# Konteyner sil (VERİ KAYBI RİSKİ!)
docker rm mysql_migration
```

### Volume Yönetimi
```bash
# Volume listesi
docker volume ls | grep mysql

# Volume bilgileri
docker volume inspect mysql_migration_data

# Volume yedekle
docker run --rm -v mysql_migration_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .

# Volume geri yükle
docker run --rm -v mysql_migration_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_backup.tar.gz -C /data
```

## 📊 Sistem Durumu Kontrolleri

### Sağlık Kontrolü
```bash
# MySQL sağlık kontrolü
docker exec mysql_migration mysqladmin ping -u root -p'migration123'

# Konteyner sağlık durumu
docker inspect mysql_migration | grep -A 10 "Health"
```

### Performans İzleme
```bash
# MySQL process listesi
docker exec -it mysql_migration mysql -u root -p'migration123' -e "SHOW PROCESSLIST;"

# MySQL durum bilgileri
docker exec -it mysql_migration mysql -u root -p'migration123' -e "SHOW STATUS;"

# Veritabanı boyutu
docker exec -it mysql_migration mysql -u root -p'migration123' -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema='mydatabase';"
```

## 🔧 Yapılandırma Dosyaları

### MySQL Yapılandırması
- **Dosya**: `config/mysql.cnf`
- **Mount**: `/etc/mysql/conf.d/custom.cnf`
- **Karakter Seti**: utf8mb3
- **Collation**: utf8mb3_turkish_ci

### Docker Compose
- **Dosya**: `docker-compose.yml`
- **Network**: `migration_network`
- **Volume**: `mysql_migration_data`

### Ortam Değişkenleri (.env)
```env
MYSQL_ROOT_PASSWORD=migration123
MYSQL_DATABASE=mydatabase
MYSQL_USER=migration_user
MYSQL_PASSWORD=migration_pass
MYSQL_PORT=3306
```

## 🚨 Güvenlik Notları

### Şifre Güvenliği
- **Root şifre**: Üretim ortamında mutlaka değiştirin
- **Kullanıcı şifreleri**: Güçlü şifreler kullanın
- **Bağlantı**: SSL/TLS kullanımını değerlendirin

### Erişim Kontrolü
- **Port**: Sadece gerekli IP'lerden erişime izin verin
- **Firewall**: 3306 portunu koruyun
- **Kullanıcı yetkileri**: Minimum gerekli yetkileri verin

## 📋 Yedekleme ve Geri Yükleme

### Manuel Yedekleme
```bash
# Tam veritabanı yedeği
docker exec mysql_migration mysqldump -u root -p'migration123' --single-transaction --routines --triggers mydatabase > mydatabase_backup_$(date +%Y%m%d_%H%M%S).sql

# Sadece yapı (veri olmadan)
docker exec mysql_migration mysqldump -u root -p'migration123' --no-data mydatabase > mydatabase_structure.sql

# Sadece veri (yapı olmadan)
docker exec mysql_migration mysqldump -u root -p'migration123' --no-create-info mydatabase > mydatabase_data.sql
```

### Geri Yükleme
```bash
# Yedekten geri yükleme
cat mydatabase_backup.sql | docker exec -i mysql_migration mysql -u root -p'migration123' mydatabase
```

## 📞 Destek ve Sorun Giderme

### Yaygın Sorunlar
1. **Bağlantı Hatası**: Konteyner çalışıyor mu kontrol edin
2. **Karakter Sorunu**: UTF-8 client bağlantısı kullanın
3. **Yetki Hatası**: Doğru kullanıcı adı/şifre kontrol edin
4. **Port Sorunu**: 3306 portu açık mı kontrol edin

### Log Dosyaları
- **MySQL Genel Log**: `logs/general.log`
- **MySQL Hata Log**: `logs/error.log`
- **Migration Log**: `logs/migration.log`

### İletişim
- **Sistem Yöneticisi**: Teknik destek için iletişime geçin
- **Dokümantasyon**: Bu dosyayı güncel tutun

---
**Son Güncelleme**: 4 Ağustos 2025  
**Versiyon**: 1.0  
**Durum**: Aktif ve Kullanıma Hazır