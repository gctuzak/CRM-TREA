-- Minimal CRM Database Schema
-- UTF8MB4 charset for Turkish character support

DROP DATABASE IF EXISTS mydatabase;
CREATE DATABASE mydatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mydatabase;

-- Users table
CREATE TABLE USER (
  ID int NOT NULL AUTO_INCREMENT,
  NAME varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  EMAIL varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PASSWORD varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  ROLE varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  STATUS varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  CREATED_AT timestamp DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  UNIQUE KEY email_unique (EMAIL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts table
CREATE TABLE CONTACT (
  ID int NOT NULL AUTO_INCREMENT,
  NAME varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  EMAIL varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PHONE varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  COMPANY varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  POSITION varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  ADDRESS text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  NOTES text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  STATUS varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  CREATED_AT timestamp DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opportunities table
CREATE TABLE OPPORTUNITY (
  ID int NOT NULL AUTO_INCREMENT,
  TITLE varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DESCRIPTION text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  CONTACT_ID int,
  AMOUNT decimal(15,2),
  CURRENCY varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  STAGE varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'prospect',
  PROBABILITY int DEFAULT 0,
  EXPECTED_CLOSE_DATE date,
  STATUS varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  CREATED_AT timestamp DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  FOREIGN KEY (CONTACT_ID) REFERENCES CONTACT(ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE TASK (
  ID int NOT NULL AUTO_INCREMENT,
  TITLE varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DESCRIPTION text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  CONTACT_ID int,
  OPPORTUNITY_ID int,
  ASSIGNED_TO int,
  DUE_DATE datetime,
  PRIORITY varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  STATUS varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  CREATED_AT timestamp DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  FOREIGN KEY (CONTACT_ID) REFERENCES CONTACT(ID),
  FOREIGN KEY (OPPORTUNITY_ID) REFERENCES OPPORTUNITY(ID),
  FOREIGN KEY (ASSIGNED_TO) REFERENCES USER(ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data
INSERT INTO USER (NAME, EMAIL, PASSWORD, ROLE) VALUES 
  ('Admin User', 'admin@example.com', 'hashed_password', 'admin'),
  ('Test User', 'test@example.com', 'hashed_password', 'user'),
  ('Ahmet Yılmaz', 'ahmet@example.com', 'hashed_password', 'user');

INSERT INTO CONTACT (NAME, EMAIL, PHONE, COMPANY) VALUES 
  ('John Doe', 'john@example.com', '+1234567890', 'Example Corp'),
  ('Jane Smith', 'jane@example.com', '+1234567891', 'Test Inc'),
  ('Ahmet Yılmaz', 'ahmet@example.com', '+905551234567', 'Türk Şirketi'),
  ('Mehmet Öz', 'mehmet@example.com', '+905551234568', 'Öz Ltd Şti'),
  ('Ayşe Çelik', 'ayse@example.com', '+905551234569', 'Çelik Holding');

INSERT INTO OPPORTUNITY (TITLE, DESCRIPTION, CONTACT_ID, AMOUNT, STAGE) VALUES 
  ('Website Development', 'Corporate website project', 1, 15000.00, 'proposal'),
  ('Mobile App', 'iOS and Android app development', 2, 25000.00, 'negotiation'),
  ('Sistem Entegrasyonu', 'ERP sistemi entegrasyonu', 3, 50000.00, 'prospect');

INSERT INTO TASK (TITLE, DESCRIPTION, CONTACT_ID, ASSIGNED_TO, DUE_DATE, PRIORITY) VALUES 
  ('Follow up call', 'Call client about proposal', 1, 1, '2025-08-10 10:00:00', 'high'),
  ('Send proposal', 'Prepare and send project proposal', 2, 2, '2025-08-12 17:00:00', 'medium'),
  ('Teknik toplantı', 'Müşteri ile teknik detayları görüşme', 3, 1, '2025-08-15 14:00:00', 'high');