### Detaylı Geliştirme Prompt'u (AI Geliştirici için)

**Proje Adı:** ITEM CRM

**Ana Hedef:** `databasebilgileri.md` dosyasında tanımlanan mevcut MySQL veritabanını kullanarak, eski verilerle tam uyumlu, modern, hızlı ve kullanıcı dostu bir full-stack CRM web uygulaması geliştir. Uygulama, mevcut veri yapısını temel almalı ancak modern UI/UX prensipleri ve teknolojilerle kullanıcı deneyimini en üst düzeye çıkarmalıdır.

**Teknoloji Yığını (Öneri):**
*   **Frontend:** React (Next.js ile) veya Vue.js (Nuxt.js ile). Component kütüphanesi olarak Material UI (MUI), Ant Design veya Tailwind CSS (Headless UI ile) kullanılabilir.
*   **Backend:** Node.js (Express.js veya NestJS) veya Python (FastAPI veya Django). Veritabanı etkileşimi için TypeORM (TypeScript) veya SQLAlchemy (Python) gibi bir ORM kullanılmalı.
*   **API Mimarisi:** RESTful veya GraphQL.
*   **Deployment:** Tüm uygulama (frontend, backend) Docker ile konteynerize edilmeli ve `docker-compose` ile kolayca çalıştırılabilmelidir.

**Temel Gereksinimler ve Modüller:**

1.  **Veritabanı Bağlantısı ve Modernizasyon:**
    *   Uygulama, `databasebilgileri.md`'de belirtilen `migration_user` ile MySQL veritabanına bağlanmalıdır.
    *   **Önemli:** Veritabanı karakter seti `utf8mb3`'ten, emoji gibi modern karakterleri destekleyen `utf8mb4`'e yükseltilmelidir. Bu migrasyon için bir script hazırlanmalıdır.
    *   Tüm tablolar için ORM entity/model sınıfları oluşturulmalıdır.

2.  **Kimlik Doğrulama ve Yetkilendirme (Auth):**
    *   `USER` tablosundaki mevcut kullanıcılarla sisteme giriş yapılabilmelidir. Şifrelerin nasıl hash'lendiği bilinmiyorsa, ilk girişte şifre yenileme akışı zorunlu kılınmalıdır.
    *   JWT (JSON Web Token) tabanlı bir session yönetimi implemente edilmelidir.
    *   Rol bazlı yetkilendirme (RBAC) altyapısı kurulmalıdır (ör: Admin, Satış Temsilcisi).

3.  **Ana Panel (Dashboard):**
    *   Kullanıcının yetkisine göre dinamik olarak şekillenen bir ana panel tasarlanmalıdır.
    *   Panelde şu bileşenler yer alabilir:
        *   Bugün tamamlanması gereken görevler (`TASK`).
        *   Aktif fırsatların (`OPPORTUNITY`) durumu (ör: "Teklif Aşamasında", "Kazanıldı").
        *   Son eklenen kişiler (`CONTACT`).
        *   Genel satış metrikleri (aylık kazanılan fırsat sayısı vb.).

4.  **İletişim Yönetimi (Contacts):**
    *   `CONTACT`, `CONTACTEMAIL`, `CONTACTPHONE` ve `CONTACTFIELDVALUE` tablolarındaki tüm verileri listeleyen, arama ve filtreleme yapabilen bir arayüz.
    *   Yeni kişi ekleme, mevcut kişiyi düzenleme ve silme (CRUD) işlemleri.
    *   Kişi detay sayfasında, kişiye ait tüm telefonlar, e-postalar, özel alanlar, görevler ve fırsatlar bir arada gösterilmelidir.

5.  **Satış Yönetimi (Sales Pipeline):**
    *   `LEAD` ve `OPPORTUNITY` tablolarını yönetmek için modern bir arayüz.
    *   Kanban board (Trello benzeri) görünümü ile fırsatların (`OPPORTUNITY`) aşamaları (`JOBSTATUSTYPE` veya `STATUSTYPE` ile ilişkili olabilir) arasında sürükle-bırak ile taşınabilmesi.
    *   Yeni potansiyel müşteri (`LEAD`) ve fırsat (`OPPORTUNITY`) oluşturma formları.

6.  **Görev Yönetimi (Tasks):**
    *   `TASK` ve `TASKUSER` tablolarını kullanarak görev oluşturma, listeleme ve yönetme.
    *   Görevleri kullanıcılara atama (`USER`).
    *   Görevleri tamamlama ve arşivleme (`TASKARCHIVE`).
    *   Takvim görünümü entegrasyonu.

7.  **Raporlama (Reporting):**
    *   `REPORT` ve `FILTER` tablolarındaki mevcut tanımları kullanarak basit raporlar oluşturma ve görselleştirme.
    *   Satış performansı, kullanıcı aktivitesi gibi temel raporlar için yeni arayüzler tasarlanmalıdır.

8.  **Ayarlar (Settings):**
    *   Kullanıcıların kendi profil bilgilerini (`USEREMAIL` vb.) güncelleyebileceği bir sayfa.
    *   Admin kullanıcılar için `USER` ekleme/çıkarma, `DEPARTMENT` yönetimi gibi sistem ayarları.
