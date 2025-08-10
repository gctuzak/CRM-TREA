const XLSX = require('xlsx');
const { sequelize } = require('./server/config/database');
const Contact = require('./server/models/Contact');
const ContactEmail = require('./server/models/ContactEmail');
const ContactPhone = require('./server/models/ContactPhone');
const ContactField = require('./server/models/ContactField');
const ContactFieldValue = require('./server/models/ContactFieldValue');
const fs = require('fs');

// Excel dosyasını oku
const workbook = XLSX.readFile('./kapsamlliliste.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Excel dosyasından ${data.length} kayıt okundu.`);

// Telefon numarasını temizle
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.toString().replace(/[^0-9+]/g, '').trim();
  return cleaned.substring(0, 20); // Maksimum 20 karakter
}

// Email formatını kontrol et
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toString().trim());
}

// Özel alanları tanımla (Excel'deki standart alanlar dışındaki tüm alanlar)
const standardFields = [
  'Müşteri Adı', 'Eposta 1', 'Eposta 2', 'Telefon 1', 'Telefon 2', 'Telefon 3',
  'Adres', 'İl', 'İlçe', 'Ülke', 'Posta Kodu', 'Unvan', 'Pozisyon'
];

// Özel alanları belirle
const customFields = Object.keys(data[0] || {}).filter(field => !standardFields.includes(field));

async function importData() {
  try {
    // Veritabanı bağlantısını test et
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    // ORID değerini al (varsayılan olarak 1 kullan)
    const ORID = 1;
    const USERID = 1;

    // Özel alanları ContactField tablosuna ekle
    console.log('Özel alanlar oluşturuluyor...');
    const fieldMap = new Map();
    
    for (const fieldName of customFields) {
      try {
        const [field, created] = await ContactField.findOrCreate({
          where: {
            NAME: fieldName,
            ORID: ORID
          },
          defaults: {
            NAME: fieldName,
            TYPE: 'TEXT',
            CATEGORY: 'CF',
            ORID: ORID,
            ORDERID: 0,
            REQUIRED: 0,
            READONLY: 0,
            HIDDEN: 0
          }
        });
        fieldMap.set(fieldName, field.ID);
        if (created) {
          console.log(`Yeni özel alan oluşturuldu: ${fieldName}`);
        }
      } catch (error) {
        console.error(`Özel alan oluşturulurken hata (${fieldName}):`, error.message);
      }
    }

    console.log('Excel verileri işleniyor...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Contact kaydını oluştur veya güncelle
        const contactData = {
          NAME: (row['Müşteri Adı'] || 'Bilinmeyen').toString().substring(0, 191),
          TYPE: 'P', // Person
          TITLE: (row['Unvan'] || '').toString().substring(0, 4),
          JOBTITLE: (row['Pozisyon'] || '').toString().substring(0, 191),
          ADDRESS: (row['Adres'] || '').toString().substring(0, 191),
          CITY: (row['İl'] || '').toString().substring(0, 191),
          STATE: (row['İlçe'] || '').toString().substring(0, 191),
          COUNTRY: (row['Ülke'] || 'Türkiye').toString().substring(0, 191),
          ZIP: (row['Posta Kodu'] || '').toString().substring(0, 191),
          PARENTCONTACTNAME: '',
          ORGANIZATIONTYPEID: 0,
          ORID: ORID,
          USERID: USERID,
          DATETIME: new Date(),
          DATETIMEEDIT: new Date(),
          USERIDEDIT: USERID,
          POSITION: '',
          COORDINATE: ''
        };

        // Aynı isimde contact var mı kontrol et
        let contact = await Contact.findOne({
          where: {
            NAME: contactData.NAME,
            ORID: ORID
          }
        });

        if (contact) {
          // Mevcut contact'ı güncelle
          await contact.update({
            ...contactData,
            DATETIMEEDIT: new Date(),
            USERIDEDIT: USERID
          });
          console.log(`Contact güncellendi: ${contactData.NAME}`);
        } else {
          // Yeni contact oluştur
          contact = await Contact.create(contactData);
          console.log(`Yeni contact oluşturuldu: ${contactData.NAME}`);
        }

        // Email adreslerini ekle
        const emails = [
          row['Eposta 1'],
          row['Eposta 2']
        ].filter(email => isValidEmail(email));

        // Mevcut email'leri sil
        await ContactEmail.destroy({
          where: {
            CONTACTID: contact.ID,
            ORID: ORID
          }
        });

        // Yeni email'leri ekle
        for (const email of emails) {
          const emailStr = email.toString().trim();
          if (emailStr.length <= 70) { // Maksimum 70 karakter
            await ContactEmail.create({
              CONTACTID: contact.ID,
              EMAIL: emailStr,
              ORID: ORID,
              USERID: USERID,
              DATETIMEEDIT: new Date()
            });
          }
        }

        // Telefon numaralarını ekle
        const phones = [
          { number: row['Telefon 1'], type: 'İş' },
          { number: row['Telefon 2'], type: 'Cep' },
          { number: row['Telefon 3'], type: 'Ev' }
        ].filter(phone => cleanPhoneNumber(phone.number));

        // Mevcut telefon numaralarını sil
        await ContactPhone.destroy({
          where: {
            CONTACTID: contact.ID,
            ORID: ORID
          }
        });

        // Yeni telefon numaralarını ekle
        for (const phone of phones) {
          try {
            const cleanNumber = cleanPhoneNumber(phone.number);
            if (cleanNumber && cleanNumber.length > 0 && cleanNumber.length <= 20) {
              await ContactPhone.create({
                CONTACTID: contact.ID,
                NUMBER: cleanNumber,
                CONTROLNUMBER: cleanNumber,
                TYPE: phone.type.substring(0, 20), // TYPE alanı için de güvenlik
                ORID: ORID,
                USERID: USERID,
                DATETIMEEDIT: new Date()
              });
            }
          } catch (phoneError) {
            console.error(`Telefon ekleme hatası (${phone.number}):`, phoneError.message);
            // Telefon hatası olsa bile devam et
          }
        }

        // Özel alan değerlerini ekle
        for (const fieldName of customFields) {
          const fieldValue = row[fieldName];
          if (fieldValue && fieldValue.toString().trim()) {
            const fieldId = fieldMap.get(fieldName);
            if (fieldId) {
              const trimmedValue = fieldValue.toString().trim().substring(0, 1000); // Maksimum 1000 karakter
              
              // Mevcut değeri kontrol et
              const existingValue = await ContactFieldValue.findOne({
                where: {
                  FIELDID: fieldId,
                  CONTACTID: contact.ID,
                  ORID: ORID
                }
              });

              if (existingValue) {
                // Mevcut değeri güncelle
                await existingValue.update({
                  VALUE: trimmedValue,
                  USERID: USERID,
                  DATETIMEEDIT: new Date()
                });
              } else {
                // Yeni değer oluştur
                await ContactFieldValue.create({
                  FIELDID: fieldId,
                  CONTACTID: contact.ID,
                  VALUE: trimmedValue,
                  ORID: ORID,
                  USERID: USERID,
                  DATETIMEEDIT: new Date()
                });
              }
            }
          }
        }

        successCount++;
        
        // İlerleme göster
        if ((i + 1) % 10 === 0) {
          console.log(`İşlenen kayıt: ${i + 1}/${data.length}`);
        }

      } catch (error) {
        console.error(`Kayıt işlenirken hata (Satır ${i + 1}):`, error.message);
        console.error('Hatalı veri:', row);
        errorCount++;
      }
    }

    console.log('\n=== İÇE AKTARMA TAMAMLANDI ===');
    console.log(`Toplam kayıt: ${data.length}`);
    console.log(`Başarılı: ${successCount}`);
    console.log(`Hatalı: ${errorCount}`);
    console.log(`Özel alan sayısı: ${customFields.length}`);
    console.log('Özel alanlar:', customFields.join(', '));

    // Sonuçları dosyaya kaydet
    const report = {
      timestamp: new Date().toISOString(),
      totalRecords: data.length,
      successCount: successCount,
      errorCount: errorCount,
      customFields: customFields,
      summary: 'Excel verileri başarıyla veritabanına aktarıldı. Excel verileri en güncel kabul edilerek mevcut veriler güncellendi.'
    };

    fs.writeFileSync('./import_report.json', JSON.stringify(report, null, 2), 'utf8');
    console.log('\nDetaylı rapor import_report.json dosyasına kaydedildi.');

  } catch (error) {
    console.error('Genel hata:', error);
  } finally {
    await sequelize.close();
    console.log('Veritabanı bağlantısı kapatıldı.');
  }
}

// Scripti çalıştır
importData().catch(console.error);