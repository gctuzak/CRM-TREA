# Port Kuralları

## KATİ KURALLAR:
- **Backend Server**: MUTLAKA port 5000'de çalışmalı
- **Frontend Server**: MUTLAKA port 3000'de çalışmalı
- **Port numaralarını ASLA değiştirme!**
- Eğer port zaten kullanımdaysa, mevcut process'i `taskkill` ile sonlandır ve yeniden başlat

## Port Yönetimi:
- Port 5000 meşgulse: `taskkill /f /im node.exe` veya spesifik PID ile sonlandır
- Port 3000 meşgulse: `taskkill /f /im node.exe` veya spesifik PID ile sonlandır
- Sonlandırdıktan sonra server'ı yeniden başlat