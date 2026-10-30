import { PrismaClient, UserRole, UserStatus, KioskStatus, ColorMode, PaperSize, OrderStatus, PaymentStatus, IncidentSeverity, IncidentStatus, AuditStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function main() {
  console.log('--- Nightfall Operations Platform: Seeding Database ---');

  // 1. Seed Users (Admin, Operators, Customers)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nightfall.io' },
    update: {},
    create: {
      email: 'admin@nightfall.io',
      displayName: 'System Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      firebaseUid: 'admin-demo-uid',
    },
  });

  const customerAlex = await prisma.user.upsert({
    where: { email: 'alex.rivera@designstudio.io' },
    update: {},
    create: {
      email: 'alex.rivera@designstudio.io',
      displayName: 'Alex Rivera',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      firebaseUid: 'alex-demo-uid',
    },
  });

  const customerSarah = await prisma.user.upsert({
    where: { email: 'sarah.c@technova.com' },
    update: {},
    create: {
      email: 'sarah.c@technova.com',
      displayName: 'Sarah Chen',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      firebaseUid: 'sarah-demo-uid',
    },
  });

  const customerMarcus = await prisma.user.upsert({
    where: { email: 'mbrody@apexlogistics.com' },
    update: {},
    create: {
      email: 'mbrody@apexlogistics.com',
      displayName: 'Marcus Brody',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      firebaseUid: 'marcus-demo-uid',
    },
  });

  console.log('Seeded Users: Admin, Alex Rivera, Sarah Chen, Marcus Brody');

  // 2. Seed 3 Operating Zones
  const zonesData = [
    { id: 'ZONE_A', name: 'Zone A', label: 'Front Lobby', description: 'Primary public entrance and guest reception kiosks' },
    { id: 'ZONE_B', name: 'Zone B', label: 'Main Floor', description: 'Central open-plan office and collaborative print hub' },
    { id: 'ZONE_C', name: 'Zone C', label: 'Production', description: 'High-volume production, archival, and large-format printing' },
  ];

  for (const zone of zonesData) {
    await prisma.zone.upsert({
      where: { id: zone.id },
      update: { name: zone.name, label: zone.label, description: zone.description },
      create: zone,
    });
  }
  console.log('Seeded 3 Operating Zones (Zone A, Zone B, Zone C)');

  // 3. Seed 12 Kiosks across the 3 Zones
  // Default provisioned test kiosk key for all test kiosks is `kiosk-secret-<id>-2026`
  const kiosksData = [
    // Zone A
    { id: 'K01', name: 'Lobby Kiosk 1', zoneId: 'ZONE_A', status: KioskStatus.Online, ipAddress: '192.168.1.101', totalPrints: 840, temperature: 34, paperLevel: 92, inkLevel: 88, coordX: -4.5, coordY: 0, coordZ: 2.2 },
    { id: 'K02', name: 'Lobby Kiosk 2', zoneId: 'ZONE_A', status: KioskStatus.Online, ipAddress: '192.168.1.102', totalPrints: 920, temperature: 35, paperLevel: 85, inkLevel: 90, coordX: -5.5, coordY: 0, coordZ: 0.2 },
    { id: 'K03', name: 'Lobby Kiosk 3', zoneId: 'ZONE_A', status: KioskStatus.Online, ipAddress: '192.168.1.103', totalPrints: 1120, temperature: 42, paperLevel: 70, inkLevel: 65, coordX: -3.5, coordY: 0, coordZ: -1.8 },
    { id: 'K04', name: 'Lobby Kiosk 4', zoneId: 'ZONE_A', status: KioskStatus.Online, ipAddress: '192.168.1.104', totalPrints: 780, temperature: 32, paperLevel: 95, inkLevel: 94, coordX: -2.2, coordY: 0, coordZ: 0.8 },
    // Zone B
    { id: 'K05', name: 'Floor Center 1', zoneId: 'ZONE_B', status: KioskStatus.Online, ipAddress: '192.168.1.105', totalPrints: 1248, temperature: 38, paperLevel: 62, inkLevel: 74, coordX: -0.8, coordY: 0, coordZ: 1.5, currentJobId: '#NF-1048', queueLength: 1 },
    { id: 'K06', name: 'Floor Center 2', zoneId: 'ZONE_B', status: KioskStatus.Online, ipAddress: '192.168.1.106', totalPrints: 1410, temperature: 36, paperLevel: 78, inkLevel: 82, coordX: 1.2, coordY: 0, coordZ: 1.5 },
    { id: 'K07', name: 'Floor East 1', zoneId: 'ZONE_B', status: KioskStatus.Online, ipAddress: '192.168.1.107', totalPrints: 1350, temperature: 35, paperLevel: 80, inkLevel: 79, coordX: -0.8, coordY: 0, coordZ: -1.2 },
    { id: 'K08', name: 'Floor East 2', zoneId: 'ZONE_B', status: KioskStatus.Online, ipAddress: '192.168.1.108', totalPrints: 1520, temperature: 36, paperLevel: 88, inkLevel: 85, coordX: 1.2, coordY: 0, coordZ: -1.2 },
    // Zone C
    { id: 'K09', name: 'Production Line 1', zoneId: 'ZONE_C', status: KioskStatus.Online, ipAddress: '192.168.1.109', totalPrints: 2100, temperature: 37, paperLevel: 54, inkLevel: 60, coordX: 3.5, coordY: 0, coordZ: -1.5, currentJobId: '#NF-1045', queueLength: 2 },
    { id: 'K10', name: 'Production Line 2', zoneId: 'ZONE_C', status: KioskStatus.Online, ipAddress: '192.168.1.110', totalPrints: 1980, temperature: 36, paperLevel: 72, inkLevel: 77, coordX: 5.2, coordY: 0, coordZ: -0.8 },
    { id: 'K11', name: 'Production Line 3', zoneId: 'ZONE_C', status: KioskStatus.Online, ipAddress: '192.168.1.111', totalPrints: 2340, temperature: 39, paperLevel: 48, inkLevel: 55, coordX: 3.8, coordY: 0, coordZ: 1.5, currentJobId: '#NF-1046', queueLength: 1 },
    { id: 'K12', name: 'Production Line 4', zoneId: 'ZONE_C', status: KioskStatus.Error, ipAddress: '192.168.1.112', totalPrints: 2210, temperature: 40, paperLevel: 12, inkLevel: 61, coordX: 5.5, coordY: 0, coordZ: 1.0, queueLength: 3 },
  ];

  for (const k of kiosksData) {
    const rawKey = `kiosk-secret-${k.id}-2026`;
    const hashedKey = hashApiKey(rawKey);

    await prisma.kiosk.upsert({
      where: { id: k.id },
      update: {
        name: k.name,
        zoneId: k.zoneId,
        status: k.status,
        ipAddress: k.ipAddress,
        apiKeyHash: hashedKey,
        totalPrints: k.totalPrints,
        temperature: k.temperature,
        paperLevel: k.paperLevel,
        inkLevel: k.inkLevel,
        coordX: k.coordX,
        coordY: k.coordY,
        coordZ: k.coordZ,
        currentJobId: k.currentJobId,
        queueLength: k.queueLength || 0,
        isRevoked: false,
      },
      create: {
        id: k.id,
        name: k.name,
        zoneId: k.zoneId,
        status: k.status,
        ipAddress: k.ipAddress,
        apiKeyHash: hashedKey,
        totalPrints: k.totalPrints,
        temperature: k.temperature,
        paperLevel: k.paperLevel,
        inkLevel: k.inkLevel,
        coordX: k.coordX,
        coordY: k.coordY,
        coordZ: k.coordZ,
        currentJobId: k.currentJobId,
        queueLength: k.queueLength || 0,
        isRevoked: false,
      },
    });
  }
  console.log('Seeded 12 Kiosks (K01-K12) with securely hashed revocable credentials');

  // 4. Seed Documents & Orders
  const doc1 = await prisma.document.upsert({
    where: { storageKey: 'docs/alex-design-print-v3.pdf' },
    update: {},
    create: {
      id: 'doc-1048',
      ownerId: customerAlex.id,
      storageKey: 'docs/alex-design-print-v3.pdf',
      originalFilename: 'Design_Print_v3.pdf',
      verifiedMimeType: 'application/pdf',
      fileSize: 14889728, // 14.2 MB
      pageCount: 24,
    },
  });

  const doc2 = await prisma.document.upsert({
    where: { storageKey: 'docs/sarah-report-april.pdf' },
    update: {},
    create: {
      id: 'doc-1047',
      ownerId: customerSarah.id,
      storageKey: 'docs/sarah-report-april.pdf',
      originalFilename: 'Report_April.pdf',
      verifiedMimeType: 'application/pdf',
      fileSize: 5033164, // 4.8 MB
      pageCount: 12,
    },
  });

  const doc3 = await prisma.document.upsert({
    where: { storageKey: 'docs/marcus-invoice-258.pdf' },
    update: {},
    create: {
      id: 'doc-1046',
      ownerId: customerMarcus.id,
      storageKey: 'docs/marcus-invoice-258.pdf',
      originalFilename: 'Invoice_258.pdf',
      verifiedMimeType: 'application/pdf',
      fileSize: 2202009, // 2.1 MB
      pageCount: 8,
    },
  });

  // Seed Orders matching reference
  await prisma.order.upsert({
    where: { id: '#NF-1048' },
    update: {},
    create: {
      id: '#NF-1048',
      customerId: customerAlex.id,
      documentId: doc1.id,
      kioskId: 'K05',
      copies: 2,
      pageCount: 24,
      colorMode: ColorMode.Color,
      paperSize: PaperSize.A4,
      duplex: true,
      subtotal: 16.80,
      tax: 1.70,
      totalAmount: 18.50,
      currency: 'USD',
      status: OrderStatus.Printing,
      paymentStatus: PaymentStatus.Paid,
      progress: 68,
      estimatedCompletion: '2 min remaining',
      timeline: [
        { title: 'Order Submitted & Payment Verified', description: 'Credit Card (Stripe demo: ending 4242)', time: '10 min ago', completed: true },
        { title: 'File Preflight & Rasterization', description: 'CMYK rendering completed at 600 DPI', time: '8 min ago', completed: true },
        { title: 'Spooling to Kiosk K05', description: 'Transferred via encrypted TLS socket', time: '5 min ago', completed: true },
        { title: 'Printing in Progress', description: 'Duplex printing pages 16 of 24', time: 'Active', completed: false },
        { title: 'Completed & Bin Dispensed', description: 'Tray output ready for collection', time: 'Pending', completed: false },
      ],
    },
  });

  await prisma.order.upsert({
    where: { id: '#NF-1047' },
    update: {},
    create: {
      id: '#NF-1047',
      customerId: customerSarah.id,
      documentId: doc2.id,
      kioskId: 'K03',
      copies: 1,
      pageCount: 12,
      colorMode: ColorMode.Monochrome,
      paperSize: PaperSize.A4,
      duplex: true,
      subtotal: 3.84,
      tax: 0.36,
      totalAmount: 4.20,
      currency: 'USD',
      status: OrderStatus.Completed,
      paymentStatus: PaymentStatus.Paid,
      progress: 100,
      estimatedCompletion: 'Finished',
      timeline: [
        { title: 'Order Submitted', description: 'Mobile app submission', time: '25 min ago', completed: true },
        { title: 'Spooling to Kiosk K03', description: 'Job accepted', time: '22 min ago', completed: true },
        { title: 'Printing Completed', description: 'All 12 pages verified', time: '18 min ago', completed: true },
        { title: 'Collected by User', description: 'PIN authenticated pickup', time: '15 min ago', completed: true },
      ],
    },
  });

  await prisma.order.upsert({
    where: { id: '#NF-1046' },
    update: {},
    create: {
      id: '#NF-1046',
      customerId: customerMarcus.id,
      documentId: doc3.id,
      kioskId: 'K11',
      copies: 5,
      pageCount: 8,
      colorMode: ColorMode.Color,
      paperSize: PaperSize.Letter,
      duplex: false,
      subtotal: 11.11,
      tax: 0.89,
      totalAmount: 12.00,
      currency: 'USD',
      status: OrderStatus.Printing,
      paymentStatus: PaymentStatus.Paid,
      progress: 42,
      estimatedCompletion: '4 min remaining',
      timeline: [
        { title: 'Order Submitted', description: 'Portal order', time: '18 min ago', completed: true },
        { title: 'Spooling to Kiosk K11', description: 'Assigned to Production high-speed queue', time: '14 min ago', completed: true },
        { title: 'Printing in Progress', description: 'Copy 3 of 5 being processed', time: 'Active', completed: false },
      ],
    },
  });

  // Seed PrintJobs linked to orders
  await prisma.printJob.upsert({
    where: { orderId: '#NF-1048' },
    update: {},
    create: {
      orderId: '#NF-1048',
      kioskId: 'K05',
      status: 'PRINTING',
      progress: 68,
      attemptCount: 1,
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  await prisma.printJob.upsert({
    where: { orderId: '#NF-1047' },
    update: {},
    create: {
      orderId: '#NF-1047',
      kioskId: 'K03',
      status: 'COMPLETED',
      progress: 100,
      attemptCount: 1,
      startedAt: new Date(Date.now() - 22 * 60 * 1000),
      completedAt: new Date(Date.now() - 18 * 60 * 1000),
    },
  });

  await prisma.printJob.upsert({
    where: { orderId: '#NF-1046' },
    update: {},
    create: {
      orderId: '#NF-1046',
      kioskId: 'K11',
      status: 'PRINTING',
      progress: 42,
      attemptCount: 1,
      startedAt: new Date(Date.now() - 14 * 60 * 1000),
    },
  });

  // 5. Seed Incidents
  const incidentsData = [
    {
      id: 'INC-402',
      kioskId: 'K12',
      zone: 'Production',
      severity: IncidentSeverity.Error,
      title: 'Printing error - paper jam',
      description: 'Tray 2 optical sensor triggered paper feed stall during duplex feed. Mechanism locked to prevent tear.',
      status: IncidentStatus.Open,
      reportedBy: 'Automated Telemetry Sensor #S-82',
    },
    {
      id: 'INC-401',
      kioskId: 'K03',
      zone: 'Front Lobby',
      severity: IncidentSeverity.Warning,
      title: 'High temperature',
      description: 'Internal fuser core temperature reached 42°C (alert threshold 40°C). Secondary fan ramped to 100%.',
      status: IncidentStatus.Open,
      reportedBy: 'Thermal Core Monitor',
    },
    {
      id: 'INC-398',
      kioskId: 'K06',
      zone: 'Main Floor',
      severity: IncidentSeverity.Info,
      title: 'Routine Paper Tray Refill',
      description: 'Tray 1 replenished with 500 sheets standard 80gsm white paper.',
      status: IncidentStatus.Resolved,
      reportedBy: 'Tech Operator - J. Miller',
      resolvedAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
  ];

  for (const inc of incidentsData) {
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: {},
      create: inc,
    });
  }

  // 6. Seed Audit Logs
  const auditLogsData = [
    {
      id: 'AUD-8831',
      actor: 'admin@nightfall.io',
      actorRole: 'System Administrator',
      action: 'KIOSK_RESTART_REQUESTED',
      resource: 'Kiosk K12',
      status: AuditStatus.SUCCESS,
      ipAddress: '10.0.4.12',
      payload: { command: 'soft_restart', reason: 'paper_jam_clearing_assist', authorizedBy: 'Admin' },
    },
    {
      id: 'AUD-8830',
      actor: 'system.telemetry',
      actorRole: 'Automated Agent',
      action: 'INCIDENT_CREATED',
      resource: 'INC-402 (K12)',
      status: AuditStatus.WARNING,
      ipAddress: '192.168.1.112',
      payload: { sensor: 'optical_feed_2', code: 'FEED_JAM_0x22', severity: 'Error' },
    },
    {
      id: 'AUD-8829',
      actor: 'alex.rivera@designstudio.io',
      actorRole: 'Customer',
      action: 'ORDER_SUBMITTED',
      resource: 'Order #NF-1048',
      status: AuditStatus.SUCCESS,
      ipAddress: '172.56.21.90',
      payload: { amount: 18.5, document: 'Design_Print_v3.pdf', pages: 24, copies: 2 },
    },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {},
      create: log,
    });
  }

  console.log('Seeded Incidents and Audit Logs');
  console.log('--- Nightfall Seed Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

