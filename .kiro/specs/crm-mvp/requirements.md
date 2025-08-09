# CRM MVP Requirements Document

## Introduction

Bu dokümant, mevcut MySQL veritabanını kullanan CRM sisteminin Minimum Uygulanabilir Ürün (MVP) versiyonu için gereksinimleri tanımlar. MVP'nin amacı, sistemin çekirdek değer önerisini (merkezi müşteri yönetimi ve satış takibi) en hızlı şekilde hayata geçirerek kullanıcı geri bildirimi almak ve projenin doğru yolda ilerlediğini doğrulamaktır.

## Requirements

### Requirement 1: Otomatik Admin Kullanıcı Oturumu

**User Story:** As a CRM user, I want to automatically access the system as an admin user, so that I can immediately start using CRM features without authentication barriers during MVP phase.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL automatically set the current user as admin from USER table
2. WHEN displaying user info THEN the system SHALL show admin user name in the navigation
3. WHEN accessing any page THEN the system SHALL not require authentication or login
4. WHEN making API calls THEN the system SHALL use the predefined admin user context
5. WHEN displaying user-specific data THEN the system SHALL use admin user ID for filtering where applicable

### Requirement 2: Kişi Listesi ve Arama

**User Story:** As a CRM user, I want to view and search all contacts from the CONTACT table, so that I can quickly find and access customer information.

#### Acceptance Criteria

1. WHEN user accesses contacts page THEN the system SHALL display all contacts from CONTACT table
2. WHEN user enters search term THEN the system SHALL filter contacts by NAME, JOBTITLE, or ADDRESS fields
3. WHEN displaying contacts THEN the system SHALL show NAME, TYPE (Person/Organization), CITY, and basic contact info
4. WHEN contact list is empty THEN the system SHALL display "No contacts found" message
5. WHEN contact list has more than 50 items THEN the system SHALL implement pagination
6. WHEN user clicks on a contact THEN the system SHALL navigate to contact details page

### Requirement 3: Kişi Detay Görüntüleme

**User Story:** As a CRM user, I want to view detailed information about a specific contact, so that I can see all related data including emails, phones, and associated records.

#### Acceptance Criteria

1. WHEN user selects a contact THEN the system SHALL display complete contact information from CONTACT table
2. WHEN displaying contact details THEN the system SHALL show all emails from CONTACTEMAIL table
3. WHEN displaying contact details THEN the system SHALL show all phone numbers from CONTACTPHONE table
4. WHEN displaying contact details THEN the system SHALL show related opportunities from OPPORTUNITY table
5. WHEN displaying contact details THEN the system SHALL show related tasks from TASK table
6. WHEN contact has custom fields THEN the system SHALL display values from CONTACTFIELDVALUE table
7. WHEN contact data is not found THEN the system SHALL display "Contact not found" error

### Requirement 4: Fırsat Listesi Görüntüleme

**User Story:** As a CRM user, I want to view all opportunities in a simple list format, so that I can track sales pipeline and opportunities.

#### Acceptance Criteria

1. WHEN user accesses opportunities page THEN the system SHALL display all opportunities from OPPORTUNITY table
2. WHEN displaying opportunities THEN the system SHALL show NAME, FINALTOTAL, CURRENCY, and STATUSTYPEID
3. WHEN displaying opportunities THEN the system SHALL show associated contact name from CONTACT table
4. WHEN displaying opportunities THEN the system SHALL show assigned user from USER table
5. WHEN opportunity list has more than 50 items THEN the system SHALL implement pagination
6. WHEN user clicks on opportunity THEN the system SHALL show basic opportunity details
7. WHEN opportunity has no amount THEN the system SHALL display "No amount specified"

### Requirement 5: Kullanıcı Görev Listesi

**User Story:** As a CRM user, I want to view tasks assigned to me, so that I can manage my work and track what needs to be done.

#### Acceptance Criteria

1. WHEN user accesses tasks page THEN the system SHALL display tasks where USERID matches current user
2. WHEN displaying tasks THEN the system SHALL show NOTE, STATUS, DATETIMEDUE, and related contact
3. WHEN task is overdue THEN the system SHALL highlight it with different color/styling
4. WHEN task has no due date THEN the system SHALL display "No due date"
5. WHEN displaying tasks THEN the system SHALL group by STATUS (New, In progress, Completed)
6. WHEN user clicks on task THEN the system SHALL show task details including related opportunity
7. WHEN task list is empty THEN the system SHALL display "No tasks assigned" message

### Requirement 6: Temel Navigasyon ve Layout

**User Story:** As a CRM user, I want a clean and intuitive interface, so that I can easily navigate between different sections of the application.

#### Acceptance Criteria

1. WHEN user is logged in THEN the system SHALL display a navigation menu with Contacts, Opportunities, Tasks sections
2. WHEN user is on any page THEN the system SHALL show current user name and logout option
3. WHEN application loads THEN the system SHALL be responsive and work on mobile devices
4. WHEN user navigates between pages THEN the system SHALL maintain consistent layout and styling
5. WHEN system encounters an error THEN the system SHALL display user-friendly error messages
6. WHEN data is loading THEN the system SHALL show loading indicators

### Requirement 7: Veri Güvenliği ve Performans

**User Story:** As a system administrator, I want the application to be performant and handle data safely, so that the system responds quickly and data integrity is maintained.

#### Acceptance Criteria

1. WHEN making database queries THEN the system SHALL use parameterized queries to prevent SQL injection
2. WHEN loading large datasets THEN the system SHALL implement pagination to maintain performance
3. WHEN API responds THEN the response time SHALL be under 500ms for typical queries
4. WHEN displaying sensitive data THEN the system SHALL not expose password fields or internal system data unnecessarily
5. WHEN handling errors THEN the system SHALL log errors appropriately without exposing sensitive information
6. WHEN processing requests THEN the system SHALL validate input data to prevent malicious content