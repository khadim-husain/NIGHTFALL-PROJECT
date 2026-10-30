import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Authentication & Role-Based Authorization Security', () => {
  const app = createApp();
  let adminToken: string;
  let customerToken: string;
  let otherCustomerToken: string;

  beforeAll(async () => {
    // Generate test tokens
    const adminAuth = await authService.generateDemoToken('admin@nightfall.io');
    adminToken = adminAuth.token;

    const custAuth = await authService.generateDemoToken('alex.rivera@designstudio.io');
    customerToken = custAuth.token;

    const otherAuth = await authService.generateDemoToken('sarah.c@technova.com');
    otherCustomerToken = otherAuth.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects protected routes when Authorization header is missing', async () => {
    const res = await request(app).post('/api/v1/orders').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid or tampered Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-garbage-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('allows verified admin to access admin routes', async () => {
    const res = await request(app)
      .post('/api/v1/kiosks/K01/restart')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('blocks customer from attempting admin-only operations (RBAC 403)', async () => {
    const res = await request(app)
      .post('/api/v1/kiosks/K01/revoke')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('prevents customer from accessing another customer private order', async () => {
    // Order #NF-1048 belongs to alex.rivera@designstudio.io
    // Sarah Chen (otherCustomerToken) tries to access it
    const res = await request(app)
      .get('/api/v1/orders/%23NF-1048')
      .set('Authorization', `Bearer ${otherCustomerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCESS_DENIED');
  });

  it('rejects revoked kiosk worker credentials', async () => {
    // Create a temporary revoked kiosk
    await prisma.kiosk.upsert({
      where: { id: 'K99' },
      update: { isRevoked: true },
      create: {
        id: 'K99',
        name: 'Revoked Test Kiosk',
        zoneId: 'ZONE_A',
        status: 'Offline',
        ipAddress: '192.168.1.199',
        apiKeyHash: 'dummy_hash',
        isRevoked: true,
      },
    });

    const res = await request(app)
      .post('/api/v1/kiosks/K99/heartbeat')
      .set('x-kiosk-id', 'K99')
      .set('x-kiosk-key', 'any-key')
      .send({ status: 'Online' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('KIOSK_REVOKED');
  });
});

