const request = require('supertest');
const { sequelize } = require('../config/database');
const { User, Lead } = require('../models');
const { app } = require('../server');
const { generateToken } = require('../utils/jwt');

describe('Leads API', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'Sales Executive'
    });

    authToken = generateToken(testUser.id);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/leads', () => {
    it('should create a new lead', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Lead',
          email: 'lead@example.com',
          phone: '1234567890',
          company: 'Test Company',
          status: 'New'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lead).toHaveProperty('id');
      expect(res.body.data.lead.name).toBe('Test Lead');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test Lead',
          email: 'lead@example.com'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/leads', () => {
    it('should get all leads', async () => {
      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leads).toBeInstanceOf(Array);
    });
  });
});


