# Gereksinimler Belgesi

## Giriş

Bu özellik, kişi kartlarında e-posta ve telefon bilgilerinin görüntülenmediği kritik sorunları ele alır ve kişiler sayfası için kapsamlı bir arama işlevselliği uygular. Sistem şu anda gerekli veritabanı tablolarına (CONTACTEMAIL ve CONTACTPHONE) ve model ilişkilerine sahiptir, ancak API uç noktaları ve frontend bileşenleri bu verileri düzgün şekilde kullanmamaktadır.

## Gereksinimler

### Gereksinim 1

**Kullanıcı Hikayesi:** Bir CRM kullanıcısı olarak, kişi kartlarında e-posta ve telefon bilgilerini görmek istiyorum, böylece tam kişi görünümünü açmadan iletişim detaylarına hızlıca erişebilirim.

#### Kabul Kriterleri

1. Kişiler listesini görüntülerken sistem her kişi için birincil e-posta adresini kişi kartında gösterecek
2. Kişiler listesini görüntülerken sistem her kişi için birincil telefon numarasını kişi kartında gösterecek
3. Bir kişinin birden fazla e-posta adresi varsa sistem liste görünümünde ilk e-posta adresini gösterecek
4. Bir kişinin birden fazla telefon numarası varsa sistem liste görünümünde ilk telefon numarasını gösterecek
5. Bir kişinin e-posta veya telefon bilgisi yoksa sistem yer tutucu olarak "-" gösterecek

### Gereksinim 2

**Kullanıcı Hikayesi:** Bir CRM kullanıcısı olarak, kişi detay modalında tüm e-posta ve telefon bilgilerini görmek istiyorum, böylece bir kişi veya kuruluş için tüm iletişim yöntemlerini görüntüleyebilir ve yönetebilirim.

#### Kabul Kriterleri

1. Kişi detay modalını açarken sistem kişiyle ilişkili tüm e-posta adreslerini gösterecek
2. Kişi detay modalını açarken sistem kişiyle ilişkili tüm telefon numaralarını gösterecek
3. Birden fazla e-posta görüntülerken sistem her e-postayı ayrı bir satırda gösterecek
4. Birden fazla telefon numarası görüntülerken sistem her telefon numarasını türüyle birlikte gösterecek (varsa)
5. Bir kişiyi düzenlerken sistem e-posta adreslerini ekleme, düzenleme ve kaldırma imkanı sağlayacak
6. Bir kişiyi düzenlerken sistem telefon numaralarını ekleme, düzenleme ve kaldırma imkanı sağlayacak

### Gereksinim 3

**Kullanıcı Hikayesi:** Bir CRM kullanıcısı olarak, kişileri ad, e-posta, telefon, şirket veya iş unvanına göre arayabilmek istiyorum, böylece büyük bir veritabanında belirli kişileri hızlıca bulabilirim.

#### Kabul Kriterleri

1. Arama girişine metin girdiğimde sistem kişileri gerçek zamanlı olarak filtreleyecek
2. Arama yaparken sistem kişi adı, e-posta adresleri, telefon numaraları, şirket adı ve iş unvanı ile eşleşecek
3. Arama sonuçları görüntülendiğinde sistem sonuçlarda eşleşen metni vurgulayacak
4. Arama girişi boş olduğunda sistem tüm kişileri gösterecek
5. Hiçbir kişi arama kriterlerine uymadığında sistem "Kişi bulunamadı" mesajı gösterecek
6. Arama yaparken sistem arama sonuçları için sayfalamayı koruyacak

### Gereksinim 4

**Kullanıcı Hikayesi:** Bir CRM kullanıcısı olarak, arama işlevselliğinin duyarlı ve performanslı olmasını istiyorum, böylece büyük kişi veritabanlarıyla verimli şekilde çalışabilirim.

#### Kabul Kriterleri

1. Arama girişine yazarken sistem arama isteklerini 300ms gecikme ile yapacak
2. Arama gerçekleştirirken sistem aramayı 2 saniye içinde tamamlayacak
3. Arama devam ederken sistem bir yükleme göstergesi gösterecek
4. Arama sonuçları döndüğünde sistem kişi listesini tam sayfa yenileme olmadan güncelleyecek
5. Arama bir hatayla karşılaştığında sistem uygun bir hata mesajı gösterecek

### Gereksinim 5

**Kullanıcı Hikayesi:** Bir CRM kullanıcısı olarak, arama sonuçlarını kolayca temizleyebilmek istiyorum, böylece tüm kişileri görüntülemeye hızlıca dönebilirim.

#### Kabul Kriterleri

1. Arama girişinde metin varsa sistem bir temizleme butonu (X) gösterecek
2. Temizleme butonuna tıkladığımda sistem arama girişini boşaltacak ve tüm kişileri gösterecek
3. Arama girişinde Escape tuşuna bastığımda sistem aramayı temizleyecek
4. Aramayı temizlerken sistem sayfalamayı ilk sayfaya sıfırlayacak