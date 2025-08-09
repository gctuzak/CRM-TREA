const request = require('supertest');
const app = require('../../index');
const { setupTestDatabase, cleanupTestDatabase, createTestData } = require('../setup');

describe('API Integration Tests', () => {
  let testData;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await createTestData();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Health Check', () => {
    test('GET /health should return system status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('Contacts API', () => {
    test('GET /api/contacts should return contacts with pagination', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .expect(200);

      expect(response.body).toHaveProperty('contacts');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.contacts)).toBe(true);
      expect(response.body.pagination).toHaveProperty('currentPage');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    test('GET /api/contacts with search should filter results', async () => {
      const response = await request(app)
        .get('/api/contacts?search=Test')
        .expect(200);

      expect(response.body.contacts.length).toBeGreaterThan(0);
      expect(response.body.contacts[0].NAME).toContain('Test');
    });

    test('GET /api/contacts/:id should return specific contact', async () => {
      const response = await request(app)
        .get(`/api/contacts/${testData.contact.ID}`)
        .expect(200);

      expect(response.body.contact).toHaveProperty('ID', testData.contact.ID);
      expect(response.body.contact).toHaveProperty('NAME', 'Test Contact');
    });

    test('POST /api/contacts should create new contact', async () => {
      const newContact = {
        name: 'New Test Contact',
        jobTitle: 'New Manager',
        address: 'New Address',
        city: 'New City',
        note: 'Created via API test'
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(newContact)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Contact created successfully');
      expect(response.body.contact).toHaveProperty('NAME', newContact.name);
    });

    test('PUT /api/contacts/:id should update contact', async () => {
      const updateData = {
        name: 'Updated Test Contact',
        jobTitle: 'Updated Manager'
      };

      const response = await request(app)
        .put(`/api/contacts/${testData.contact.ID}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Contact updated successfully');
      expect(response.body.contact).toHaveProperty('NAME', updateData.name);
    });
  });

  describe('Opportunities API', () => {
    test('GET /api/opportunities should return opportunities with pagination', async () => {
      const response = await request(app)
        .get('/api/opportunities')
        .expect(200);

      expect(response.body).toHaveProperty('opportunities');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.opportunities)).toBe(true);
    });

    test('GET /api/opportunities/:id should return specific opportunity', async () => {
      const response = await request(app)
        .get(`/api/opportunities/${testData.opportunity.ID}`)
        .expect(200);

      expect(response.body.opportunity).toHaveProperty('ID', testData.opportunity.ID);
      expect(response.body.opportunity).toHaveProperty('NAME', 'Test Opportunity');
    });

    test('POST /api/opportunities should create new opportunity', async () => {
      const newOpportunity = {
        name: 'New Test Opportunity',
        note: 'Created via API test',
        contactId: testData.contact.ID,
        finalTotal: '5000',
        currency: 'TRY'
      };

      const response = await request(app)
        .post('/api/opportunities')
        .send(newOpportunity)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Opportunity created successfully');
      expect(response.body.opportunity).toHaveProperty('NAME', newOpportunity.name);
    });
  });

  describe('Tasks API', () => {
    test('GET /api/tasks should return tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    test('GET /api/tasks/overdue should return overdue tasks', async () => {
      const response = await request(app)
        .get('/api/tasks/overdue')
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    test('POST /api/tasks should create new task', async () => {
      const newTask = {
        note: 'New test task',
        status: 'New',
        contactId: testData.contact.ID,
        datetimeDue: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Task created successfully');
      expect(response.body.task).toHaveProperty('NOTE', newTask.note);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/contacts/999999 should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .get('/api/contacts/999999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Contact not found');
    });

    test('POST /api/contacts with invalid data should return validation error', async () => {
      const invalidContact = {
        name: '', // Empty name should fail validation
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidContact)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('GET /nonexistent-route should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Performance Tests', () => {
    test('API responses should be under 500ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/contacts')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    test('Pagination should handle large page numbers efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/contacts?page=100&limit=20')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});