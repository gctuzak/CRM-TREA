# Veritabanı Şeması Çözümlemesi

## Tablo: CONTACT

### Sütunlar

| Sütun Adı | Veri Tipi | Varsayılan | Boş Geçilebilir | Otomatik Artan |
|---|---|---|---|---|
| ID | int(10) | NULL | NOT NULL | True |
| NAME | varchar(250) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| CONTROLNAME | varchar(10) | NULL | NULL | False |
| TYPE | set | NULL | NULL | False |
| TITLE | varchar(4) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| JOBTITLE | varchar(500) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| ADDRESS | varchar(500) | NULL | NULL | False |
| CITY | varchar(250) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| STATE | char(250) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| COUNTRY | char(250) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| ZIP | varchar(250) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| PARENTCONTACTID | int(10) | NULL | NULL | False |
| PARENTCONTACTNAME | varchar(100) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| NOTE | text CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| ORGANIZATIONTYPEID | int(10) | NULL | NOT NULL | False |
| ORID | int(10) | NULL | NOT NULL | False |
| USERID | int(10) | NULL | NOT NULL | False |
| DATETIME | datetime | NULL | NOT NULL | False |
| DATETIMEEDIT | datetime | NULL | NOT NULL | False |
| USERIDEDIT | int(10) | NULL | NOT NULL | False |
| GOOGLEID | varchar(500) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| POSITION | varchar(200) | NULL | NOT NULL | False |
| COORDINATE | varchar(100) | NULL | NOT NULL | False |
| STAMP | timestamp | NULL | NULL | False |

### Birincil Anahtar

- ORID, ID

## Tablo: CONTACTEMAIL

### Sütunlar

| Sütun Adı | Veri Tipi | Varsayılan | Boş Geçilebilir | Otomatik Artan |
|---|---|---|---|---|
| ID | int(10) | NULL | NOT NULL | True |
| CONTACTID | int(10) | NULL | NOT NULL | False |
| EMAIL | varchar(70) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| ORID | int(10) | NULL | NOT NULL | False |
| USERID | int(10) | NULL | NOT NULL | False |
| DATETIMEEDIT | datetime | NULL | NULL | False |
| STAMP | timestamp | NULL | NULL | False |

### Birincil Anahtar

- ORID, ID

## Tablo: CONTACTPHONE

### Sütunlar

| Sütun Adı | Veri Tipi | Varsayılan | Boş Geçilebilir | Otomatik Artan |
|---|---|---|---|---|
| ID | int(10) | NULL | NOT NULL | True |
| CONTACTID | int(10) | NULL | NOT NULL | False |
| NUMBER | varchar(250) | NULL | NOT NULL | False |
| CONTROLNUMBER | varchar(10) | NULL | NULL | False |
| TYPE | varchar(6) | NULL | NOT NULL | False |
| ORID | int(10) | NULL | NOT NULL | False |
| USERID | int(10) | NULL | NOT NULL | False |
| DATETIMEEDIT | datetime | NULL | NULL | False |
| STAMP | timestamp | NULL | NULL | False |

### Birincil Anahtar

- ORID, ID

## Tablo: JOBSTATUSTYPE

### Sütunlar

| Sütun Adı | Veri Tipi | Varsayılan | Boş Geçilebilir | Otomatik Artan |
|---|---|---|---|---|
| ID | int(10) | NULL | NOT NULL | True |
| NAME | varchar(30) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| ORID | int(10) | NULL | NOT NULL | False |
| STAMP | timestamp | NULL | NULL | False |

### Birincil Anahtar

- ORID, ID

## Tablo: OPPORTUNITYPRODUCT

### Sütunlar

| Sütun Adı | Veri Tipi | Varsayılan | Boş Geçilebilir | Otomatik Artan |
|---|---|---|---|---|
| ID | int(10) | NULL | NOT NULL | True |
| ORID | int(10) | NULL | NOT NULL | False |
| PRODUCTID | varchar(500) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| OPPID | int(10) | NULL | NOT NULL | False |
| AMOUNT | varchar(20) | NULL | NOT NULL | False |
| PRICE | varchar(20) | NULL | NOT NULL | False |
| UNITPRICE | varchar(20) | NULL | NOT NULL | False |
| UNITCOST | varchar(20) | NULL | NOT NULL | False |
| DISCOUNT | varchar(20) | NULL | NOT NULL | False |
| CURRENCY | varchar(3) | NULL | NOT NULL | False |
| UPCURRENCY | varchar(3) | NULL | NOT NULL | False |
| DESCRIPTION | varchar(1000) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| VATPER | varchar(5) | NULL | NOT NULL | False |
| LISTNAME | varchar(100) | NULL | NOT NULL | False |
| DETAILS | tinyint(1) | NULL | NULL | False |
| EXTENSION | varchar(1) | NULL | NOT NULL | False |
| PURCHID | int(10) | NULL | NULL | False |
| STAMP | timestamp | NULL | NULL | False |

## Tablo: STATUSTYPE

### Sütunlar

| Sütun Adı | Veri Tipi | Varsayılan | Boş Geçilebilir | Otomatik Artan |
|---|---|---|---|---|
| ID | int(10) | NULL | NOT NULL | True |
| NAME | varchar(30) CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| ORID | int(10) | NULL | NOT NULL | False |
| TYPE | varchar(5) | NULL | NOT NULL | False |
| STAMP | timestamp | NULL | NULL | False |

### Birincil Anahtar

- ORID, ID, TYPE

## Tablo: TASKARCHIVE

### Sütunlar

| Sütun Adı | Veri Tipi | Varsayılan | Boş Geçilebilir | Otomatik Artan |
|---|---|---|---|---|
| ID | int(10) | NULL | NOT NULL | True |
| USERID | int(10) | NULL | NOT NULL | False |
| DATETIME | datetime | NULL | NULL | False |
| DATETIMEDUE | datetime | NULL | NULL | False |
| NOTE | text CHARACTER SET utf8mb3 COLLATE | NULL | NULL | False |
| STATUS | set | NULL | NULL | False |
| TYPEID | int(10) | NULL | NOT NULL | False |
| CONTACTID | int(10) | NULL | NULL | False |
| OPPORTUNITYID | int(10) | NULL | NOT NULL | False |
| LEADID | int(10) | NULL | NOT NULL | False |
| JOBID | int(10) | NULL | NOT NULL | False |
| ORID | int(10) | NULL | NOT NULL | False |
| DATETIMEEDIT | datetime | NULL | NULL | False |
| USERIDEDIT | int(10) | NULL | NOT NULL | False |
| FOLLOWID | int(10) | NULL | NULL | False |
| PARENTTASKID | int(10) | NULL | NOT NULL | False |
| RECUR | varchar(20) | NULL | NULL | False |
| RECURDUEDATE | datetime | NULL | NULL | False |
| GOOGLETASKID | varchar(100) | NULL | NULL | False |
| STAMP | timestamp | NULL | NULL | False |

### Birincil Anahtar

- ORID, ID

