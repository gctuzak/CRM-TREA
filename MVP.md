### Minimum Uygulanabilir Ürün (MVP)

**Amaç:** Sistemin çekirdek değer önerisini (merkezi müşteri yönetimi ve satış takibi) en hızlı şekilde hayata geçirerek kullanıcı geri bildirimi almak ve projenin doğru yolda ilerlediğini doğrulamak.

**MVP Kapsamındaki Özellikler:**

1.  **Zorunlu (Must-Have):**
    *   `USER` tablosundaki kullanıcılarla sisteme **giriş yapma**.
    *   `CONTACT` tablosundaki tüm kişileri **listeleme ve arama**.
    *   Bir kişinin **detaylarını görüntüleme** (iletişim bilgileri ve ilişkili temel kayıtlar).
    *   `OPPORTUNITY` tablosundaki tüm fırsatları basit bir liste görünümünde **görüntüleme**.
    *   `TASK` tablosundaki, kullanıcıya atanmış görevleri **listeleme**.

2.  **Olmaması Gerekenler (Won't-Have for MVP):**
    *   Dashboard (Ana Panel).
    *   Yeni kayıt oluşturma (Kişi, Fırsat, Görev ekleme). MVP sadece mevcut veriyi okumaya odaklanacaktır.
    *   Kayıt düzenleme ve silme.
    *   Gelişmiş raporlama, filtreleme ve ayarlar.
    *   Kanban panosu gibi gelişmiş UI bileşenleri.
    *   Karakter seti migrasyonu (`utf8mb4`'e geçiş MVP sonrası yapılabilir).
