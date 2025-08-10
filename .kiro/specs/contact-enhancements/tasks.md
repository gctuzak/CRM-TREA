# Uygulama Planı

- [x] 1. Backend API'sini e-posta ve telefon verilerini dahil edecek şekilde güncelle
  - Contact model'inin getWithRelatedData metodunu aktif hale getir ve tüm ilişkili verileri döndürecek şekilde güncelle
  - Contacts API endpoint'ini (/api/contacts) ilişkili e-posta ve telefon verilerini dahil edecek şekilde modifiye et
  - API yanıtlarının doğru formatta e-posta ve telefon dizilerini içerdiğini doğrula
  - _Gereksinimler: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Gelişmiş arama işlevselliği için backend desteği ekle





  - Contact model'inin findWithPagination metodunu e-posta ve telefon verilerini arama kriterlerine dahil edecek şekilde güncelle
  - Arama sorgularının e-posta adreslerinde ve telefon numaralarında da arama yapmasını sağla
  - Arama performansını optimize et ve JOIN sorgularını iyileştir
  - _Gereksinimler: 3.1, 3.2, 4.1, 4.2_

- [x] 3. Frontend tip tanımlamalarını güncelle


  - ContactEmail ve ContactPhone arayüzlerini client/src/types/index.ts dosyasına ekle
  - Contact arayüzünü emails ve phones dizilerini içerecek şekilde genişlet
  - Arama filtreleri için SearchFilters arayüzü oluştur
  - _Gereksinimler: 1.1, 2.1, 3.1_

- [x] 4. Kişi listesinde e-posta ve telefon bilgilerini görüntüle
  - contacts.tsx sayfasındaki kişi listesi tablosunu e-posta ve telefon sütunlarını gösterecek şekilde güncelle
  - Her kişi için birincil e-posta ve telefon numarasını görüntüleyen kod ekle
  - E-posta veya telefon bilgisi olmayan kişiler için "-" placeholder'ı göster
  - _Gereksinimler: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Arama input bileşeni oluştur ve entegre et
  - Yeniden kullanılabilir SearchInput bileşeni oluştur (client/src/components/UI/SearchInput.tsx zaten mevcut, güncelle)
  - 300ms debouncing ile gerçek zamanlı arama işlevselliği ekle
  - Temizleme butonu (X) ve Escape tuşu desteği implement et
  - _Gereksinimler: 3.1, 4.1, 5.1, 5.2, 5.3_

- [x] 6. Kişiler sayfasına arama işlevselliğini entegre et
  - contacts.tsx sayfasına SearchInput bileşenini ekle
  - Arama state'ini yönet ve API çağrılarını gerçekleştir
  - Arama sonuçlarını filtreleyerek görüntüle ve sayfalama ile entegre et
  - _Gereksinimler: 3.1, 3.4, 3.6, 4.4_

- [x] 7. Kişi detay modalında tüm e-posta ve telefon bilgilerini göster
  - Kişi detay modalını tüm e-posta adreslerini listeleyecek şekilde güncelle
  - Kişi detay modalını tüm telefon numaralarını tip bilgisiyle birlikte gösterecek şekilde güncelle
  - Birden fazla e-posta ve telefon için uygun görsel düzenleme yap
  - _Gereksinimler: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Arama sonuçlarında eşleşen metni vurgulama özelliği ekle






  - Arama sonuçlarında eşleşen metni vurgulayan yardımcı fonksiyon oluştur
  - Kişi listesinde arama terimiyle eşleşen kısımları vurgula
  - Arama sonuçları için "Kişi bulunamadı" mesajı göster
  - _Gereksinimler: 3.3, 3.5_

- [x] 9. Yükleme durumları ve hata işleme iyileştirmeleri





  - Arama sırasında yükleme göstergesi göster (mevcut implementasyonu iyileştir)
  - Arama hatalarını yakala ve uygun hata mesajları göster
  - Ağ hatalarını ve zaman aşımı durumlarını daha iyi işle
  - _Gereksinimler: 4.3, 4.5_

- [x] 10. E-posta ve telefon düzenleme işlevselliği ekle (opsiyonel)





  - Kişi düzenleme modalında e-posta ekleme/düzenleme/silme işlevselliği
  - Kişi düzenleme modalında telefon ekleme/düzenleme/silme işlevselliği
  - E-posta ve telefon verilerini kaydetmek için API endpoint'leri oluştur
  - _Gereksinimler: 2.5, 2.6_

- [ ] 11. Performans optimizasyonları ve testler
  - Arama performansını test et ve gerekirse optimizasyon yap
  - Component testleri yazarak arama ve görüntüleme işlevselliğini doğrula
  - E2E testler ile tam kullanıcı akışını test et
  - _Gereksinimler: 4.2, 4.4_

- [ ] 12. Son entegrasyon ve kullanıcı deneyimi iyileştirmeleri
  - Tüm bileşenleri entegre et ve çapraz test yap
  - Responsive tasarım iyileştirmeleri yap
  - Klavye navigasyonu ve erişilebilirlik özelliklerini ekle
  - _Gereksinimler: 5.4_