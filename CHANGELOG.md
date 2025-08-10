# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

## [1.1.0] - 2025-08-10

### Eklenen
- Excel veri aktarım sistemi (`import_excel_to_db.js`)
- Excel dosyası analiz aracı (`analyze_excel.js`)
- Telefon numarası temizleme ve doğrulama
- E-posta adresi doğrulama (70 karakter sınırı)
- Özel alan (custom field) desteği
- Veri aktarım raporu sistemi
- Türkçe karakter desteği
- Veritabanı bağlantı test aracı (`check_db.js`)

### Geliştirildi
- Veritabanı modelleri normalize edildi
- Contact, ContactEmail, ContactPhone tabloları ayrıştırıldı
- ContactField ve ContactFieldValue tabloları eklendi
- Veri kalitesi kontrolleri iyileştirildi
- Hata yakalama ve raporlama sistemi

### Düzeltildi
- Telefon numarası uzunluk sınırı sorunları
- Karakter kodlama sorunları
- Veri truncation hataları
- Veritabanı bağlantı konfigürasyonu

### Teknik Detaylar
- 3,683 kayıttan 3,678'i başarıyla aktarıldı (%99.9 başarı oranı)
- 10 özel alan tanımlandı ve aktarıldı
- Excel dosyası analizi ve veri mapping sistemi
- Detaylı import raporu (`import_report.json`)

## [1.0.0] - 2025-08-09

### Eklenen
- İlk CRM sistemi kurulumu
- MySQL veritabanı entegrasyonu
- Temel Contact yönetimi
- Opportunity (Fırsat) yönetimi
- Task (Görev) yönetimi
- User (Kullanıcı) yönetimi
- Next.js frontend
- Express.js backend
- Docker desteği