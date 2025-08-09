# Tasarım Belgesi

## Genel Bakış

Bu tasarım, kişi kartlarında e-posta ve telefon bilgilerinin görüntülenmesi ve kapsamlı arama işlevselliği için gerekli değişiklikleri tanımlar. Mevcut sistem zaten gerekli veritabanı tablolarına ve model ilişkilerine sahiptir, ancak API uç noktaları ve frontend bileşenleri bu verileri düzgün şekilde kullanmamaktadır.

## Mimari

### Mevcut Durum
- `CONTACT`, `CONTACTEMAIL`, `CONTACTPHONE` tabloları mevcuttur
- Sequelize modelleri ve ilişkileri tanımlanmıştır
- Frontend kişi listesi ve detay modalı mevcuttur
- Backend API uç noktaları temel CRUD işlemlerini destekler

### Hedef Durum
- API uç noktaları ilişkili e-posta ve telefon verilerini dahil edecek
- Frontend bileşenleri e-posta ve telefon bilgilerini görüntüleyecek
- Gerçek zamanlı arama işlevselliği eklenecek
- Performans optimizasyonları uygulanacak

## Bileşenler ve Arayüzler

### Backend Değişiklikleri

#### 1. Contact Model Güncellemeleri
- `getWithRelatedData` metodunu aktif hale getirme
- Arama metodlarını e-posta ve telefon verilerini dahil edecek şekilde genişletme
- Performans için eager loading optimizasyonları

#### 2. API Uç Noktası Değişiklikleri
- `GET /api/contacts` - İlişkili e-posta ve telefon verilerini dahil etme
- `GET /api/contacts/:id` - Tam detay verilerini döndürme
- `GET /api/contacts/search` - Gelişmiş arama işlevselliği
- Yeni arama parametreleri: `email`, `phone`, `company`

#### 3. Yeni Arama Servisi
```javascript
// Arama servisi yapısı
class ContactSearchService {
  async searchContacts(query, options) {
    // E-posta, telefon, ad, şirket, pozisyon araması
    // Debouncing ve caching desteği
    // Sayfalama desteği
  }
}
```

### Frontend Değişiklikleri

#### 1. Kişi Listesi Bileşeni Güncellemeleri
- Kişi kartlarında e-posta ve telefon görüntüleme
- Arama input bileşeni entegrasyonu
- Gerçek zamanlı filtreleme
- Yükleme durumu göstergeleri

#### 2. Yeni Arama Bileşeni
```typescript
interface SearchInputProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  debounceMs?: number;
}
```

#### 3. Kişi Detay Modal Güncellemeleri
- Tüm e-posta adreslerini listeleme
- Tüm telefon numaralarını listeleme
- E-posta ve telefon ekleme/düzenleme/silme işlevselliği

#### 4. Tip Tanımlamaları
```typescript
interface ContactWithDetails extends Contact {
  emails: ContactEmail[];
  phones: ContactPhone[];
}

interface SearchFilters {
  query?: string;
  email?: string;
  phone?: string;
  company?: string;
}
```

## Veri Modelleri

### Mevcut Modeller (Değişiklik Yok)
- `Contact` - Ana kişi bilgileri
- `ContactEmail` - E-posta adresleri
- `ContactPhone` - Telefon numaraları

### API Yanıt Formatları

#### Kişi Listesi Yanıtı
```json
{
  "contacts": [
    {
      "ID": 1,
      "NAME": "Ahmet Yılmaz",
      "JOBTITLE": "Yazılım Geliştirici",
      "CITY": "İstanbul",
      "emails": [
        {
          "ID": 1,
          "EMAIL": "ahmet@example.com"
        }
      ],
      "phones": [
        {
          "ID": 1,
          "NUMBER": "0532 123 45 67",
          "TYPE": "mobile"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

#### Arama Yanıtı
```json
{
  "contacts": [...],
  "searchQuery": "ahmet",
  "totalMatches": 15,
  "searchTime": 120
}
```

## Hata İşleme

### Backend Hata Senaryoları
1. **Veritabanı Bağlantı Hatası**: 500 Internal Server Error
2. **Geçersiz Arama Parametreleri**: 400 Bad Request
3. **Kişi Bulunamadı**: 404 Not Found
4. **Arama Zaman Aşımı**: 408 Request Timeout

### Frontend Hata İşleme
1. **Ağ Hatası**: "Bağlantı hatası" mesajı
2. **Arama Hatası**: "Arama yapılırken hata oluştu" mesajı
3. **Veri Yükleme Hatası**: "Veriler yüklenirken hata oluştu" mesajı

## Test Stratejisi

### Backend Testleri
1. **Unit Testler**
   - Contact model metodları
   - Arama servisi işlevselliği
   - API uç noktası yanıtları

2. **Integration Testler**
   - Veritabanı ilişkileri
   - API uç noktası tam akışları
   - Arama performansı

### Frontend Testleri
1. **Component Testleri**
   - Arama input bileşeni
   - Kişi kartı görüntüleme
   - Modal işlevselliği

2. **E2E Testleri**
   - Tam arama akışı
   - Kişi detay görüntüleme
   - Mobil uyumluluk

### Performans Testleri
1. **Arama Performansı**: 1000+ kişi ile arama süresi < 2s
2. **Sayfa Yükleme**: İlk yükleme < 3s
3. **Bellek Kullanımı**: Arama sırasında bellek sızıntısı kontrolü

## Güvenlik Konuları

### Veri Koruması
- E-posta adreslerinin XSS saldırılarına karşı korunması
- Telefon numaralarının format doğrulaması
- SQL injection koruması (Sequelize ORM ile sağlanır)

### Arama Güvenliği
- Arama sorgularının sanitizasyonu
- Rate limiting (dakikada maksimum 60 arama)
- Kötü niyetli arama sorgularına karşı koruma

## Performans Optimizasyonları

### Backend Optimizasyonları
1. **Veritabanı İndeksleri**
   - `CONTACTEMAIL.EMAIL` için indeks
   - `CONTACTPHONE.NUMBER` için indeks
   - `CONTACT.NAME` için full-text indeks

2. **Sorgu Optimizasyonları**
   - Eager loading ile N+1 sorgu problemini önleme
   - Sayfalama için LIMIT/OFFSET optimizasyonu
   - Arama için LIKE yerine MATCH AGAINST kullanımı

### Frontend Optimizasyonları
1. **Debouncing**: 300ms gecikme ile arama istekleri
2. **Caching**: Arama sonuçlarını geçici olarak önbellekleme
3. **Virtual Scrolling**: Büyük listelerde performans
4. **Lazy Loading**: Modal açıldığında detay verileri yükleme

## Kullanıcı Deneyimi İyileştirmeleri

### Arama Deneyimi
- Arama yaparken gerçek zamanlı öneriler
- Arama geçmişi (localStorage)
- Klavye kısayolları (Ctrl+F arama açma)
- Arama sonuçlarında vurgulama

### Görsel İyileştirmeler
- E-posta ve telefon için ikonlar
- Yükleme animasyonları
- Boş durum görselleri
- Responsive tasarım iyileştirmeleri

## Dağıtım Stratejisi

### Aşamalı Dağıtım
1. **Faz 1**: Backend API değişiklikleri
2. **Faz 2**: Frontend temel görüntüleme
3. **Faz 3**: Arama işlevselliği
4. **Faz 4**: Performans optimizasyonları

### Geri Dönüş Planı
- Önceki API versiyonunu koruma
- Feature flag ile yeni özellikleri kontrol etme
- Hata durumunda hızlı geri dönüş mekanizması