# Veritabanı Yapısı Analizi

## Genel Mimari

### Çok Kiracılı Yapı (Multi-Tenant)
- **ORID (Organization ID)**: Tüm tablolarda bulunan ve çok kiracılı yapıyı sağlayan temel alan
- **Composite Primary Key**: Çoğu tabloda (ORID, ID) şeklinde birleşik birincil anahtar kullanılıyor
- **Veri İzolasyonu**: Her organizasyon kendi ORID'si ile verilerini ayırıyor

### Audit Trail (İzleme)
- **STAMP**: Tüm tablolarda otomatik güncellenen zaman damgası
- **DATETIME/DATETIMEEDIT**: Oluşturma ve son düzenleme tarihleri
- **USERID/USERIDEDIT**: Oluşturan ve son düzenleyen kullanıcı bilgileri

## Ana Tablolar ve Yapıları

### 1. CONTACT Tablosu (Merkezi Hub)
**Primary Key**: (ORID, ID)
**Önemli Alanlar**:
- `ID`: Auto-increment benzersiz tanımlayıcı
- `NAME`: Kişi/organizasyon adı
- `CONTROLNAME`: Arama için normalleştirilmiş ad
- `TYPE`: Set türü (P=Person, O=Organization)
- `PARENTCONTACTID`: Hiyerarşik yapı için üst organizasyon referansı
- `ORGANIZATIONTYPEID`: Organizasyon tipi referansı
- `GOOGLEID`: Google entegrasyonu için
- `POSITION/COORDINATE`: Coğrafi konum bilgileri

**Foreign Key İlişkileri**:
- `PARENTCONTACTID` → CONTACT.ID (Self-referencing)
- `ORGANIZATIONTYPEID` → ORGANIZATIONTYPE.ID
- `USERID` → USER.ID (Oluşturan)
- `USERIDEDIT` → USER.ID (Düzenleyen)

### 2. USER Tablosu (Kullanıcı Yönetimi)
**Primary Key**: (ORID, ID)
**Önemli Alanlar**:
- `NAME`: Kullanıcı adı
- `EMAIL`: E-posta adresi
- `PSW/KEYP`: Şifre ve güvenlik anahtarı
- `PERMISSION`: JSON formatında yetki bilgileri
- `CONTACTID`: İlgili kişi kaydı referansı
- `CALLNUMBER1-100`: 100 adet arama numarası alanı
- `TOKEN1/TOKEN2`: API entegrasyon tokenları
- `TASKALERT1-5`: Farklı görev uyarı ayarları

**Foreign Key İlişkileri**:
- `CONTACTID` → CONTACT.ID

### 3. TASK Tablosu (Görev Yönetimi)
**Primary Key**: (ORID, ID)
**Önemli Alanlar**:
- `USERID`: Görev sahibi
- `DATETIME/DATETIMEDUE`: Başlangıç ve bitiş tarihleri
- `NOTE`: Görev detayları (text)
- `STATUS`: Görev durumu
- `TYPEID`: Görev tipi referansı
- `PARENTTASKID`: Hiyerarşik görev yapısı
- `RECUR/RECURDUEDATE`: Tekrarlayan görev ayarları
- `GOOGLETASKID`: Google Tasks entegrasyonu

**Foreign Key İlişkileri**:
- `USERID` → USER.ID
- `TYPEID` → TASKTYPE.ID
- `CONTACTID` → CONTACT.ID
- `OPPORTUNITYID` → OPPORTUNITY.ID
- `LEADID` → LEAD.ID
- `JOBID` → JOB.ID
- `USERIDEDIT` → USER.ID
- `PARENTTASKID` → TASK.ID (Self-referencing)

### 4. OPPORTUNITY Tablosu (Satış Fırsatları)
**Primary Key**: (ORID, ID)
**Önemli Alanlar**:
- `NAME`: Fırsat adı
- `CONTACTID/CLIENTID`: İlgili kişi/müşteri
- `STATUSTYPEID`: Fırsat durumu
- `OWNERUSERID`: Fırsat sahibi
- `LEADID`: Dönüştürülen lead referansı
- `USDRATE/EURRATE`: Döviz kurları
- `DISCOUNTPER/DISCOUNTAMN`: İndirim bilgileri
- `SUBTOTAL/TOTALCOST/FINALTOTAL`: Maliyet hesaplamaları
- `VATPER1-3/VATVALUE1-3`: KDV hesaplamaları

**Foreign Key İlişkileri**:
- `CONTACTID` → CONTACT.ID
- `CLIENTID` → CONTACT.ID
- `STATUSTYPEID` → STATUSTYPE.ID
- `OWNERUSERID` → USER.ID
- `USERID` → USER.ID
- `USERIDEDIT` → USER.ID
- `LEADID` → LEAD.ID

### 5. LEAD Tablosu (Potansiyel Müşteriler)
**Primary Key**: (ORID, ID)
**Önemli Alanlar**:
- `NAME`: Lead adı
- `CONTACTID/CLIENTID`: İlgili kişi bilgileri
- `STATUSTYPEID`: Lead durumu
- `OWNERUSERID`: Lead sahibi

**Foreign Key İlişkileri**:
- `CONTACTID` → CONTACT.ID
- `CLIENTID` → CONTACT.ID
- `STATUSTYPEID` → STATUSTYPE.ID
- `OWNERUSERID` → USER.ID
- `USERID` → USER.ID
- `USERIDEDIT` → USER.ID

## Destek Tabloları

### İletişim Bilgileri
- **CONTACTEMAIL**: Kişi e-posta adresleri (1:N)
- **CONTACTPHONE**: Kişi telefon numaraları (1:N)
- **USEREMAIL**: Kullanıcı alternatif e-postaları (1:N)

### Özel Alanlar
- **CONTACTFIELD**: Dinamik alan tanımları
- **CONTACTFIELDVALUE**: Özel alan değerleri
- **CONTACTFIELDPRESET**: Önceden tanımlı değerler

### Görev Yönetimi
- **TASKTYPE**: Görev tipleri (Toplantı, Arama, vb.)
- **TASKUSER**: Görev-kullanıcı atamaları (M:N)
- **TASKARCHIVE/TASKUSERARCHIVE**: Arşiv tabloları

### Etkinlik Yönetimi
- **EVENT**: Takvim etkinlikleri
- **EVENTGUEST**: Etkinlik katılımcıları

### Proje Yönetimi
- **JOB**: Proje/iş kayıtları
- **JOBSTATUSTYPE**: İş durumu tipleri

### Fiyatlandırma
- **PRICELIST**: Fiyat listeleri
- **PRICELISTDETAIL**: Fiyat detayları
- **PRICEDISCOUNT**: İndirim kuralları
- **OPPORTUNITYPRODUCT**: Fırsat ürünleri

### Sistem Tabloları
- **ORGANIZATIONTYPE**: Organizasyon tipleri
- **STATUSTYPE**: Genel durum tipleri
- **DEPARTMENT**: Departmanlar
- **USERCODES**: Kullanıcı kodları
- **REPORT**: Özel raporlar
- **FILTER**: Veri filtreleri
- **LOGIN_HISTORY**: Giriş geçmişi

## Tablo İlişkileri Analizi

### One-to-Many İlişkiler
1. **CONTACT → CONTACTEMAIL/CONTACTPHONE**: Bir kişinin birden fazla iletişim bilgisi
2. **USER → TASK**: Bir kullanıcının birden fazla görevi
3. **TASKTYPE → TASK**: Bir görev tipinin birden fazla görevi
4. **OPPORTUNITY → OPPORTUNITYPRODUCT**: Bir fırsatın birden fazla ürünü
5. **LEAD → OPPORTUNITY**: Bir lead'den birden fazla fırsat çıkabilir

### Many-to-Many İlişkiler
1. **TASK ↔ USER** (TASKUSER tablosu ile): Görevler birden fazla kullanıcıya atanabilir
2. **EVENT ↔ CONTACT** (EVENTGUEST tablosu ile): Etkinliklerde birden fazla katılımcı

### Self-Referencing İlişkiler
1. **CONTACT.PARENTCONTACTID → CONTACT.ID**: Organizasyon hiyerarşisi
2. **TASK.PARENTTASKID → TASK.ID**: Alt görev yapısı
3. **EVENT.PARENTID → EVENT.ID**: Etkinlik hiyerarşisi

### Cascade İlişkiler
- **CONTACT** silindiğinde: İlgili CONTACTEMAIL, CONTACTPHONE kayıtları
- **TASK** silindiğinde: İlgili TASKUSER kayıtları
- **OPPORTUNITY** silindiğinde: İlgili OPPORTUNITYPRODUCT kayıtları

## İndeks Stratejisi Önerileri

### Composite İndeksler
1. `(ORID, CONTACTID)` - Çok kullanılan foreign key kombinasyonu
2. `(ORID, USERID)` - Kullanıcı bazlı sorgular için
3. `(ORID, DATETIME)` - Tarih bazlı sorgular için

### Single Column İndeksler
1. `CONTROLNAME` - Arama işlemleri için
2. `EMAIL` - E-posta bazlı sorgular için
3. `STATUS` - Durum filtrelemesi için
4. `GOOGLETASKID/GOOGLEEVENTID` - Entegrasyon sorguları için

## Veri Bütünlüğü Kuralları

### Referential Integrity
- Tüm FK'ler NOT NULL olmalı (belirtilen durumlar hariç)
- Cascade delete kuralları tanımlanmalı
- ORID tutarlılığı kontrol edilmeli

### Business Rules
1. **CONTACT.TYPE**: Sadece 'P' veya 'O' değerleri
2. **TASK.STATUS**: Belirli durum değerleri
3. **OPPORTUNITY**: Finansal alanlar pozitif olmalı
4. **USER.EMAIL**: Benzersiz olmalı (ORID içinde)

### Audit Trail
- Her kayıt için STAMP otomatik güncellenmeli
- DATETIME/DATETIMEEDIT tutarlılığı kontrol edilmeli
- USERID/USERIDEDIT geçerli kullanıcılar olmalı

## Performans Optimizasyonu

### Partitioning
- ORID bazlı hash partitioning (mevcut 24 partition)
- Tarih bazlı range partitioning (büyük tablolar için)

### Archiving
- TASKARCHIVE/TASKUSERARCHIVE tabloları aktif kullanılmalı
- Eski kayıtlar düzenli olarak arşivlenmeli

### Query Optimization
- ORID her zaman WHERE clause'da bulunmalı
- Composite key'ler tam olarak kullanılmalı
- LIMIT kullanımı önerilir (büyük result set'ler için)

Bu analiz, mevcut veritabanı yapısının kapsamlı bir CRM sistemi için tasarlandığını ve çok kiracılı mimariye uygun olduğunu göstermektedir.