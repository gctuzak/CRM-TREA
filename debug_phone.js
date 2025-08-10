const XLSX = require('xlsx');

// Excel dosyasını oku
const workbook = XLSX.readFile('./kapsamlliliste.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Telefon numarasını temizle
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.toString().replace(/[^0-9+]/g, '').trim();
  return cleaned.substring(0, 20); // Maksimum 20 karakter
}

// Problematik kaydı bul (Zülküf Bilici)
const problemRecord = data.find(row => row['Müşteri Adı'] === 'Zülküf Bilici');

if (problemRecord) {
  console.log('Problematik kayıt bulundu:');
  console.log('Müşteri Adı:', problemRecord['Müşteri Adı']);
  console.log('Telefon 1 (ham):', problemRecord['Telefon 1']);
  console.log('Telefon 1 (tip):', typeof problemRecord['Telefon 1']);
  console.log('Telefon 1 (uzunluk):', problemRecord['Telefon 1'] ? problemRecord['Telefon 1'].toString().length : 0);
  
  const cleaned = cleanPhoneNumber(problemRecord['Telefon 1']);
  console.log('Temizlenmiş telefon:', cleaned);
  console.log('Temizlenmiş uzunluk:', cleaned ? cleaned.length : 0);
  
  // Tüm telefon alanlarını kontrol et
  ['Telefon 1', 'Telefon 2', 'Telefon 3'].forEach(field => {
    if (problemRecord[field]) {
      const raw = problemRecord[field];
      const cleaned = cleanPhoneNumber(raw);
      console.log(`${field}: "${raw}" -> "${cleaned}" (${cleaned ? cleaned.length : 0} karakter)`);
    }
  });
} else {
  console.log('Problematik kayıt bulunamadı');
}

// İlk 5 kaydın telefon numaralarını kontrol et
console.log('\n=== İLK 5 KAYDIN TELEFON NUMARALARI ===');
for (let i = 0; i < Math.min(5, data.length); i++) {
  const row = data[i];
  console.log(`\nKayıt ${i + 1}: ${row['Müşteri Adı']}`);
  ['Telefon 1', 'Telefon 2', 'Telefon 3'].forEach(field => {
    if (row[field]) {
      const raw = row[field];
      const cleaned = cleanPhoneNumber(raw);
      console.log(`  ${field}: "${raw}" -> "${cleaned}" (${cleaned ? cleaned.length : 0} karakter)`);
    }
  });
}