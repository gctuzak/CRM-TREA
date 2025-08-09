# Veri Sözlüğü

Bu veri sözlüğü, veritabanı sistemindeki tüm tabloları, sütunları ve bunların işlevlerini detaylı olarak açıklamaktadır. Sistem, müşteri ilişkileri yönetimi (CRM) ve proje yönetimi işlevlerini destekleyen kapsamlı bir yapıya sahiptir.

## Genel Sistem Mimarisi

Veritabanı sistemi, çok kiracılı (multi-tenant) bir yapıya sahiptir ve ORID (Organization ID) alanı ile farklı organizasyonların verilerini ayırmaktadır. Sistem, MyISAM depolama motoru kullanmakta ve ORID alanına göre hash partitioning uygulamaktadır.

## Tablo Açıklamaları

### CONTACT Tablosu

CONTACT tablosu, sistemin temel varlığıdır ve hem kişileri hem de organizasyonları saklamaktadır. Bu tablo, CRM sisteminin merkezinde yer alır ve diğer birçok tablo ile ilişkilidir.

**Temel Özellikler:**
- Birincil Anahtar: (ORID, ID)
- Partitioning: ORID alanına göre 24 partition
- Depolama Motoru: MyISAM

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz kayıt tanımlayıcısı | Otomatik artan, boş geçilemez |
| NAME | varchar(250) | Kişi veya organizasyon adı | Boş geçilemez, Türkçe karakter desteği |
| CONTROLNAME | varchar(10) GENERATED | Arama için normalleştirilmiş ad | Otomatik oluşturulan, Türkçe karakterler İngilizce karşılıklarına dönüştürülür |
| TYPE | set('P','O') | Kayıt tipi (P=Person, O=Organization) | P: Kişi, O: Organizasyon |
| TITLE | varchar(4) | Unvan (Mr, Mrs, Dr vb.) | Sadece kişiler için kullanılır |
| JOBTITLE | varchar(500) | İş unvanı | Kişinin pozisyonu veya görevi |
| ADDRESS | varchar(500) | Adres bilgisi | Tam adres metni |
| CITY | varchar(250) | Şehir | Bulunduğu şehir |
| STATE | char(250) | İl/Eyalet | Bölgesel konum |
| COUNTRY | char(250) | Ülke | Ülke bilgisi |
| ZIP | varchar(250) | Posta kodu | Posta/ZIP kodu |
| PARENTCONTACTID | int(10) | Üst organizasyon ID'si | Hiyerarşik yapı için |
| PARENTCONTACTNAME | varchar(100) | Üst organizasyon adı | Denormalize edilmiş ad |
| NOTE | text | Notlar | Serbest metin notları |
| ORGANIZATIONTYPEID | int(10) | Organizasyon tipi ID'si | ORGANIZATIONTYPE tablosuna referans |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı için |
| USERID | int(10) | Oluşturan kullanıcı ID'si | USER tablosuna referans |
| DATETIME | datetime | Oluşturma tarihi | Kayıt oluşturma zamanı |
| DATETIMEEDIT | datetime | Son düzenleme tarihi | Son güncelleme zamanı |
| USERIDEDIT | int(10) | Son düzenleyen kullanıcı ID'si | USER tablosuna referans |
| GOOGLEID | varchar(500) | Google entegrasyon ID'si | Google servisleri ile senkronizasyon |
| POSITION | varchar(200) | Pozisyon bilgisi | GPS koordinatları veya konum |
| COORDINATE | varchar(100) | Koordinat bilgisi | Enlem/boylam bilgisi |
| STAMP | timestamp | Zaman damgası | Otomatik güncellenen zaman damgası |

### CONTACTEMAIL Tablosu

Kişi ve organizasyonların e-posta adreslerini saklar. Bir kişinin birden fazla e-posta adresi olabilir.

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz kayıt tanımlayıcısı | Otomatik artan |
| CONTACTID | int(10) | İlgili kişi/organizasyon ID'si | CONTACT tablosuna referans |
| EMAIL | varchar(70) | E-posta adresi | Geçerli e-posta formatı |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı |
| USERID | int(10) | Oluşturan kullanıcı | USER tablosuna referans |
| DATETIMEEDIT | datetime | Son düzenleme tarihi | Güncelleme zamanı |
| STAMP | timestamp | Zaman damgası | Otomatik güncelleme |

### CONTACTPHONE Tablosu

Kişi ve organizasyonların telefon numaralarını saklar. Farklı telefon tiplerini destekler.

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz kayıt tanımlayıcısı | Otomatik artan |
| CONTACTID | int(10) | İlgili kişi/organizasyon ID'si | CONTACT tablosuna referans |
| NUMBER | varchar(20) | Telefon numarası | Tam telefon numarası |
| CONTROLNUMBER | varchar(15) | Normalleştirilmiş numara | Arama için optimize edilmiş |
| TYPE | varchar(10) | Telefon tipi | Mobil, Sabit, Faks vb. |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı |
| USERID | int(10) | Oluşturan kullanıcı | USER tablosuna referans |
| DATETIMEEDIT | datetime | Son düzenleme tarihi | Güncelleme zamanı |
| STAMP | timestamp | Zaman damgası | Otomatik güncelleme |

### CONTACTFIELD Tablosu

Dinamik özel alanları tanımlar. Sistem yöneticileri yeni alanlar ekleyebilir.

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz alan tanımlayıcısı | Otomatik artan |
| NAME | varchar(100) | Alan adı | Kullanıcı dostu alan adı |
| UNIT | varchar(50) | Birim | Ölçü birimi (kg, adet vb.) |
| TYPE | varchar(20) | Alan tipi | Text, Number, Date vb. |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı |
| RANK | int(5) | Sıralama | Görüntüleme sırası |
| MULTI | tinyint(1) | Çoklu değer | Birden fazla değer alabilir mi |
| MANDA | tinyint(1) | Zorunlu alan | Doldurulması zorunlu mu |
| SORT | int(5) | Sıralama değeri | Ekranda gösterim sırası |
| STAMP | timestamp | Zaman damgası | Otomatik güncelleme |

### CONTACTFIELDVALUE Tablosu

Özel alanların değerlerini saklar. CONTACT ve CONTACTFIELD tablolarını birleştirir.

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz değer tanımlayıcısı | Otomatik artan |
| FIELDID | int(10) | Alan ID'si | CONTACTFIELD tablosuna referans |
| CONTACTID | int(10) | Kişi/Organizasyon ID'si | CONTACT tablosuna referans |
| VALUE | text | Alan değeri | Girilen değer |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı |
| USERID | int(10) | Oluşturan kullanıcı | USER tablosuna referans |
| DATETIMEEDIT | datetime | Son düzenleme tarihi | Güncelleme zamanı |
| STAMP | timestamp | Zaman damgası | Otomatik güncelleme |

### CONTACTFIELDPRESET Tablosu

Özel alanlar için önceden tanımlanmış değerleri saklar.

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz preset tanımlayıcısı | Otomatik artan |
| CONTACTFIELDID | int(10) | Alan ID'si | CONTACTFIELD tablosuna referans |
| VALUE | varchar(255) | Önceden tanımlı değer | Seçilebilir değer |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı |
| STAMP | timestamp | Zaman damgası | Otomatik güncelleme |

### ORGANIZATIONTYPE Tablosu

Organizasyon tiplerini tanımlar (Müşteri, Tedarikçi, Partner vb.).

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz tip tanımlayıcısı | Otomatik artan |
| NAME | varchar(100) | Tip adı | Organizasyon tipi adı |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı |
| TYPE | varchar(20) | Tip kategorisi | Ana kategori |
| STAMP | timestamp | Zaman damgası | Otomatik güncelleme |

### USER Tablosu

Sistem kullanıcılarını ve ayarlarını saklar. Çok detaylı kullanıcı profili bilgileri içerir.

**Sütun Detayları:**

| Sütun Adı | Veri Tipi | Açıklama | İş Kuralları |
|-----------|-----------|----------|--------------|
| ID | int(10) AUTO_INCREMENT | Benzersiz kullanıcı tanımlayıcısı | Otomatik artan |
| NAME | varchar(100) | Kullanıcı adı | Giriş için kullanılan ad |
| EMAIL | varchar(100) | E-posta adresi | Benzersiz e-posta |
| PSW | varchar(255) | Şifre | Şifrelenmiş parola |
| KEYP | varchar(255) | Anahtar | Güvenlik anahtarı |
| PERMISSION | text | Yetki bilgileri | JSON formatında yetkiler |
| CALENDARFILTER | text | Takvim filtreleri | Takvim görünüm ayarları |
| ORGANIZATION | varchar(200) | Organizasyon adı | Bağlı organizasyon |
| ORID | int(10) | Organizasyon ID'si | Çok kiracılı yapı |
| CONTACTID | int(10) | İlgili kişi kaydı | CONTACT tablosuna referans |
| CLIENTHR | varchar(50) | Müşteri saati | Saat dilimi bilgisi |
| COUNTRY | varchar(100) | Ülke | Kullanıcının ülkesi |
| SITE | varchar(200) | Site bilgisi | Web sitesi |
| DATETIMESIGNUP | datetime | Kayıt tarihi | Hesap oluşturma zamanı |
| DATETIMESYNC | datetime | Son senkronizasyon | Son veri senkronizasyonu |
| TOKEN1-TOKEN2 | varchar(500) | API tokenları | Entegrasyon tokenları |
| TASKALERT1-5 | varchar(100) | Görev uyarıları | Farklı uyarı ayarları |
| DBNO | varchar(50) | Veritabanı numarası | Sistem içi DB referansı |
| LOGO | varchar(500) | Logo yolu | Kullanıcı/Firma logosu |
| IPNO | varchar(50) | IP numarası | Son giriş IP'si |
| MENU | text | Menü ayarları | Kişiselleştirilmiş menü |
| MENUORDER | text | Menü sırası | Menü öğelerinin sırası |
| INDUSTRY | varchar(100) | Sektör | Faaliyet alanı |
| CALLTASK | varchar(50) | Arama görevi | Arama yönetimi |
| CALLMETHOD | varchar(50) | Arama yöntemi | Arama teknolojisi |
| CALLNUMBER1-100 | varchar(20) | Arama numaraları | Çoklu arama numaraları |
| STAMP | timestamp | Zaman damgası | Otomatik güncelleme |

### USEREMAIL Tablosu

Kullanıcıların alternatif e-posta adreslerini saklar.

### USERCODES Tablosu

Kullanıcıların özel kodlarını saklar (API anahtarları, referans kodları vb.).

### DEPARTMENT Tablosu

Organizasyon içindeki departmanları tanımlar.

### TASK Tablosu

Görev yönetimi için kullanılır. Kullanıcılara atanan görevleri saklar.

**Temel Özellikler:**
- Hiyerarşik görev yapısı (PARENTTASKID)
- Tekrarlayan görevler (RECUR)
- Google Tasks entegrasyonu
- Çoklu kullanıcı ataması

### TASKTYPE Tablosu

Görev tiplerini tanımlar (Toplantı, Arama, E-posta vb.).

### TASKUSER Tablosu

Görevlerin kullanıcılara atanmasını yönetir. Çok-çok ilişkisi.

### TASKARCHIVE Tablosu

Tamamlanan veya iptal edilen görevlerin arşivini tutar.

### TASKUSERARCHIVE Tablosu

Arşivlenen görev atamalarını saklar.

### EVENT Tablosu

Takvim etkinliklerini yönetir. Google Calendar entegrasyonu destekler.

### EVENTGUEST Tablosu

Etkinlik katılımcılarını yönetir.

### OPPORTUNITY Tablosu

Satış fırsatlarını yönetir. CRM'in satış modülünün temelini oluşturur.

**Temel Özellikler:**
- Çoklu para birimi desteği
- KDV hesaplamaları
- İndirim yönetimi
- Maliyet takibi

### OPPORTUNITYPRODUCT Tablosu

Fırsatlara bağlı ürün/hizmetleri saklar.

### LEAD Tablosu

Potansiyel müşterileri (leads) yönetir.

### JOB Tablosu

Proje/iş yönetimi için kullanılır.

### STATUSTYPE Tablosu

Çeşitli durumları tanımlar (Fırsat durumları, Lead durumları vb.).

### JOBSTATUSTYPE Tablosu

İş/proje durumlarını tanımlar.

### PRICELIST Tablosu

Fiyat listelerini yönetir.

### PRICELISTDETAIL Tablosu

Fiyat listesi detaylarını saklar.

### PRICEDISCOUNT Tablosu

İndirim kurallarını yönetir.

### REPORT Tablosu

Özel raporları saklar.

### FILTER Tablosu

Veri filtreleme kurallarını saklar.

### LOGIN_HISTORY Tablosu

Kullanıcı giriş geçmişini tutar.

## Veri İlişkileri

Sistem, karmaşık bir ilişkisel yapıya sahiptir:

1. **CONTACT** tablosu merkezi hub görevi görür
2. **USER** tablosu sistem güvenliği ve yetkilendirme sağlar
3. **TASK**, **OPPORTUNITY**, **LEAD**, **JOB** tabloları iş süreçlerini yönetir
4. **ORGANIZATIONTYPE**, **STATUSTYPE** gibi tablolar referans veriler sağlar

## Güvenlik ve Performans

- Çok kiracılı yapı (ORID ile veri izolasyonu)
- Hash partitioning (24 partition)
- Zaman damgası takibi (STAMP alanları)
- Kullanıcı takibi (USERID, USERIDEDIT alanları)

## Entegrasyonlar

Sistem şu entegrasyonları destekler:
- Google Calendar (GOOGLEEVENTID)
- Google Tasks (GOOGLETASKID)
- Google Contacts (GOOGLEID)

Bu veri sözlüğü, sistemin tüm veri yapılarını kapsamlı olarak açıklamakta ve geliştiricilerin sistemi anlamasına yardımcı olmaktadır.

