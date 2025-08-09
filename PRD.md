### Ürün Gereksinimleri Dokümanı (PRD)

**1. Giriş ve Amaç**
Bu doküman, mevcut müşteri verilerini kullanarak sıfırdan geliştirilecek olan TREA CRM yazılımının gereksinimlerini, özelliklerini ve hedeflerini tanımlar. Projenin amacı, eski sistemin veri bütünlüğünü korurken, kullanıcı verimliliğini artıracak modern, hızlı ve sezgisel bir platform oluşturmaktır.

**2. Hedef Kitle**
*   Satış Temsilcileri
*   Satış Yöneticileri
*   Pazarlama Ekibi
*   Sistem Yöneticileri

**3. Ürün Özellikleri (Features)**

*   **F-01: Kullanıcı Yönetimi ve Güvenlik**
    *   Kullanıcılar e-posta ve şifre ile sisteme giriş yapabilmelidir.
    *   Rol tabanlı erişim kontrolü (Admin, User) sağlanmalıdır.
    *   Kullanıcılar profil bilgilerini (şifre, e-posta) güncelleyebilmelidir.

*   **F-02: Merkezi Dashboard**
    *   Her kullanıcıya özel, görevlerini, randevularını ve satış fırsatlarını özetleyen bir ana panel sunulmalıdır.
    *   Grafiksel raporlar ile temel metrikler (aylık satış, yeni müşteri sayısı vb.) gösterilmelidir.

*   **F-03: 360 Derece Müşteri Yönetimi**
    *   Tüm kişiler ve kurumlar listelenebilmeli, aranabilmeli ve filtrelenebilmelidir.
    *   Müşteri detay sayfasında iletişim bilgileri, geçmiş aktiviteler (görevler, fırsatlar), ve özel notlar tek bir ekranda görülebilmelidir.

*   **F-04: Görsel Satış Süreci Yönetimi (Pipeline)**
    *   Satış fırsatları, Kanban panosu üzerinde "Yeni", "Teklif", "Müzakere", "Kazanıldı/Kaybedildi" gibi aşamalarda görsel olarak yönetilebilmelidir.
    *   Fırsatların aşamalar arasında sürükle-bırak ile güncellenmesi sağlanmalıdır.

*   **F-05: Görev ve Aktivite Takibi**
    *   Kullanıcılar kendilerine veya başka kullanıcılara görev atayabilmelidir.
    *   Görevler için son tarih, öncelik ve durum bilgisi girilebilmelidir.
    *   Tamamlanan görevler arşivlenmelidir.

**4. Tasarım ve UX Gereksinimleri**
*   Uygulama, mobil cihazlar dahil tüm ekran boyutlarına uyumlu (responsive) olmalıdır.
*   Arayüz, temiz, modern ve tutarlı bir tasarım diline sahip olmalıdır.
*   Veri giriş formları basit ve anlaşılır olmalı, kullanıcı hatalarını en aza indirecek validasyonlar içermelidir.

**5. Teknik Gereksinimler**
*   Uygulama, belirtilen teknoloji yığını ile geliştirilmelidir.
*   API yanıt süreleri ortalama 200ms altında olmalıdır.
*   Kod kalitesi; linting, unit/integration testleri ve kod yorumları ile yüksek tutulmalıdır.
