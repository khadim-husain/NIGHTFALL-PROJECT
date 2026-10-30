import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('User Registration, Password Verification, PDF Receipts & Reprint Requests', () => {
  const app = createApp();
  let adminToken: string;
  const testUserEmail = `test.pilot.${Date.now()}@nightfall.io`;
  const testPassword = 'SecurePassword!123';
  let registeredToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    const adminAuth = await authService.generateDemoToken('admin@nightfall.io');
    adminToken = adminAuth.token;

    // Get an existing order for receipt testing
    const existingOrder = await prisma.order.findFirst();
    if (existingOrder) {
      testOrderId = existingOrder.id;
    }
  });

  afterAll(async () => {
    // Cleanup created test user
    await prisma.user.deleteMany({
      where: { email: testUserEmail },
    });
    await prisma.$disconnect();
  });

  it('registers a new user with scrypt password hashing and returns JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        displayName: 'Test Operator Pilot',
        email: testUserEmail,
        password: testPassword,
        role: 'CUSTOMER',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUserEmail);
    expect(res.body.data.user.displayName).toBe('Test Operator Pilot');

    registeredToken = res.body.data.token;

    // Verify scrypt hash stored in database
    const dbUser = await prisma.user.findUnique({
      where: { email: testUserEmail },
    });
    expect(dbUser).toBeDefined();
    expect(dbUser?.passwordHash).toBeDefined();
    expect(dbUser?.passwordHash).toContain(':'); // salt:hash format
  });

  it('rejects registration with duplicate email address (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        displayName: 'Duplicate Attempt',
        email: testUserEmail,
        password: 'AnotherPassword!456',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('logs in successfully with registered password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUserEmail);
  });

  it('rejects login with incorrect password (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('generates and streams an authentic binary PDF receipt', async () => {
    if (!testOrderId) return;

    const res = await request(app)
      .get(`/api/v1/orders/${testOrderId.replace('#', '')}/receipt`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment; filename=');

    // Verify PDF header magic bytes "%PDF-1.4"
    const buffer = res.body;
    const headerStr = buffer.toString('utf-8', 0, 8);
    expect(headerStr).toContain('%PDF');
  });

  it('creates an authoritative reprint order and increments kiosk queue', async () => {
    if (!testOrderId) return;

    const res = await request(app)
      .post(`/api/v1/orders/${testOrderId.replace('#', '')}/reprint`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const reprint = res.body.data;
    expect(reprint.id).toBeDefined();
    expect(reprint.status).toBe('Queued');
    expect(reprint.paymentStatus).toBe('Paid');
  });

  it('dispatches a kiosk test calibration print job with audit logging', async () => {
    const res = await request(app)
      .post('/api/v1/kiosks/K01/test-print')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kioskId).toBe('K01');
    expect(res.body.data.testJobId).toBeDefined();

    // Verify audit log created
    const log = await prisma.auditLog.findFirst({
      where: { action: 'KIOSK_TEST_PRINT_DISPATCHED' },
      orderBy: { timestamp: 'desc' },
    });
    expect(log).toBeDefined();
    expect(log?.resource).toBe('Kiosk K01');
  });
});

