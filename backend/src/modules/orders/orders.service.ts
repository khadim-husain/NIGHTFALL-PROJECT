import { prisma } from '../../config/prisma.js';
import { calculateOrderPrice } from '../../config/pricing.js';
import { AppError } from '../../middleware/errorHandler.js';
import { EventPublisher } from '../realtime/events.js';
import { UserRole, OrderStatus, PaymentStatus, ColorMode, PaperSize } from '@prisma/client';
import { receiptService } from './receipt.service.js';

export class OrdersService {
  /**
   * Helper to format Order record into frontend PrintOrder format
   */
  public formatOrder(o: any) {
    const timeDiffMinutes = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
    let createdAtText = 'Just now';
    if (timeDiffMinutes >= 60) {
      createdAtText = `${Math.floor(timeDiffMinutes / 60)} hr${Math.floor(timeDiffMinutes / 60) > 1 ? 's' : ''} ago`;
    } else if (timeDiffMinutes > 0) {
      createdAtText = `${timeDiffMinutes} min ago`;
    }

    const docName = o.document?.originalFilename || 'Document.pdf';
    const ext = docName.split('.').pop()?.toLowerCase() || 'pdf';
    const safeType = ['pdf', 'docx', 'pptx', 'png', 'jpg'].includes(ext) ? ext : 'pdf';

    let formattedSize = '3.5 MB';
    if (o.document?.fileSize) {
      if (o.document.fileSize >= 1024 * 1024) {
        formattedSize = `${(o.document.fileSize / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        formattedSize = `${Math.max(1, Math.round(o.document.fileSize / 1024))} KB`;
      }
    }

    return {
      id: o.id,
      documentName: docName,
      fileSize: formattedSize,
      fileType: safeType,
      kioskId: o.kioskId,
      customerName: o.customer?.displayName || 'Authorized User',
      customerEmail: o.customer?.email || 'user@nightfall.io',
      status: o.status,
      paymentStatus: o.paymentStatus,
      progress: o.progress,
      createdAt: createdAtText,
      copies: o.copies,
      pageCount: o.pageCount,
      colorMode: o.colorMode,
      paperSize: o.paperSize,
      duplex: o.duplex,
      totalAmount: Number(o.totalAmount),
      subtotal: Number(o.subtotal),
      tax: Number(o.tax),
      currency: o.currency,
      estimatedCompletion: o.estimatedCompletion || (o.status === 'Completed' ? 'Finished' : '2 min remaining'),
      timeline: (o.timeline as any) || [
        { title: 'Order Submitted', description: 'Received in system', time: createdAtText, completed: true },
      ],
      documentId: o.documentId,
      customerId: o.customerId,
    };
  }

  public async getOrders(
    user: { id: string; role: UserRole },
    query: { status?: OrderStatus; kioskId?: string; search?: string; page: number; limit: number }
  ) {
    const { status, kioskId, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Ordinary customers can only see their own orders!
    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.id;
    }

    if (status) where.status = status;
    if (kioskId) where.kioskId = kioskId;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { document: { originalFilename: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { displayName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, email: true, displayName: true } },
          document: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.formatOrder(o)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private getOrderIdQuery(orderId: string) {
    const raw = (orderId || '').trim();
    const upper = raw.toUpperCase();
    const withHash = upper.startsWith('#') ? upper : `#${upper}`;
    const withoutHash = upper.replace(/^#/, '');

    return {
      OR: [
        { id: { equals: withHash, mode: 'insensitive' as const } },
        { id: { equals: withoutHash, mode: 'insensitive' as const } },
        { id: withHash },
        { id: withoutHash },
        { id: raw },
      ],
    };
  }

  public async getOrderById(orderId: string, user?: { id: string; role: UserRole }) {
    const where = this.getOrderIdQuery(orderId);

    const order = await prisma.order.findFirst({
      where,
      include: {
        customer: { select: { id: true, email: true, displayName: true } },
        document: true,
        payments: true,
        printJob: true,
      },
    });

    if (!order) {
      throw new AppError(`Order '${orderId}' not found.`, 404, 'ORDER_NOT_FOUND');
    }

    if (user && user.role === UserRole.CUSTOMER && order.customerId !== user.id) {
      throw new AppError('Access forbidden: You do not own this order.', 403, 'ACCESS_DENIED');
    }

    return this.formatOrder(order);
  }

  public async createOrder(
    userId: string,
    data: {
      documentId: string;
      kioskId: string;
      copies?: number;
      pageCount?: number;
      colorMode?: ColorMode;
      paperSize?: PaperSize;
      duplex?: boolean;
    }
  ) {
    // 1. Verify Document exists and belongs to the authenticated user
    const document = await prisma.document.findUnique({
      where: { id: data.documentId },
    });

    if (!document) {
      throw new AppError('Referenced document not found.', 404, 'DOCUMENT_NOT_FOUND');
    }

    if (document.ownerId !== userId) {
      throw new AppError('Forbidden: You can only create orders for your own documents.', 403, 'UNAUTHORIZED_DOCUMENT');
    }

    // 2. Verify target kiosk exists and is active
    const kiosk = await prisma.kiosk.findUnique({
      where: { id: data.kioskId.toUpperCase() },
    });

    if (!kiosk) {
      throw new AppError(`Target kiosk '${data.kioskId}' does not exist.`, 404, 'KIOSK_NOT_FOUND');
    }

    if (kiosk.isRevoked) {
      throw new AppError(`Target kiosk '${data.kioskId}' is currently revoked.`, 400, 'KIOSK_REVOKED');
    }

    // 3. Authoritative server-side price calculation
    const pageCount = data.pageCount || document.pageCount || 1;
    const copies = data.copies || 1;
    const colorMode = data.colorMode || ColorMode.Color;
    const paperSize = data.paperSize || PaperSize.A4;
    const duplex = data.duplex !== undefined ? data.duplex : true;

    const pricing = calculateOrderPrice({
      pageCount,
      copies,
      colorMode,
      paperSize,
      duplex,
    });

    // 4. Generate order ID
    const orderId = `#NF-${Math.floor(1050 + Math.random() * 8000)}`;

    const timeline = [
      {
        title: 'Order Created',
        description: 'Waiting for payment confirmation',
        time: 'Just now',
        completed: true,
      },
      {
        title: 'Payment & Authorization',
        description: 'Awaiting customer checkout',
        time: 'Active',
        completed: false,
      },
      {
        title: `Spooling to Kiosk ${kiosk.id}`,
        description: 'Transmitting via high-speed queue',
        time: 'Pending',
        completed: false,
      },
      {
        title: 'Printing in Progress',
        description: `${copies} cop${copies > 1 ? 'ies' : 'y'} (${pageCount} pages, ${colorMode})`,
        time: 'Pending',
        completed: false,
      },
    ];

    const order = await prisma.order.create({
      data: {
        id: orderId,
        customerId: userId,
        documentId: document.id,
        kioskId: kiosk.id,
        copies,
        pageCount,
        colorMode,
        paperSize,
        duplex,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        totalAmount: pricing.totalAmount,
        currency: pricing.currency,
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Pending,
        progress: 0,
        timeline,
      },
      include: {
        customer: { select: { id: true, email: true, displayName: true } },
        document: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        actor: order.customer.email,
        actorRole: 'Customer',
        action: 'ORDER_CREATED',
        resource: `Order ${order.id}`,
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        payload: {
          orderId: order.id,
          amount: Number(order.totalAmount),
          kioskId: order.kioskId,
        },
      },
    });

    const formatted = this.formatOrder(order);
    EventPublisher.publishOrderCreated(formatted);

    return formatted;
  }

  public async cancelOrder(orderId: string, user: { id: string; role: UserRole }) {
    const where = this.getOrderIdQuery(orderId);
    const order = await prisma.order.findFirst({
      where,
      include: { printJob: true },
    });

    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (user.role === UserRole.CUSTOMER && order.customerId !== user.id) {
      throw new AppError('Cannot cancel orders of other customers.', 403, 'ACCESS_DENIED');
    }

    if (order.status === OrderStatus.Completed) {
      throw new AppError('Cannot cancel an order that is already completed.', 400, 'ORDER_ALREADY_COMPLETED');
    }

    if (order.printJob && order.printJob.status === 'PRINTING') {
      throw new AppError('Cannot cancel order: Printing has already started on kiosk.', 400, 'PRINTING_IN_PROGRESS');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.Cancelled,
        },
      });

      if (order.printJob) {
        await tx.printJob.update({
          where: { id: order.printJob.id },
          data: { status: 'FAILED' },
        });
      }

      return ord;
    });

    return updated;
  }

  public async generateReceiptPdf(orderId: string, user?: { id: string; role: UserRole }): Promise<Buffer> {
    const order = await this.getOrderById(orderId, user);
    return receiptService.generateReceiptPdf({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      documentName: order.documentName,
      kioskId: order.kioskId,
      copies: order.copies,
      pageCount: order.pageCount,
      colorMode: order.colorMode,
      paperSize: order.paperSize,
      duplex: order.duplex,
      subtotal: order.subtotal,
      tax: order.tax,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    });
  }

  public async requestReprint(orderId: string, user: { id: string; role: UserRole }) {
    const where = this.getOrderIdQuery(orderId);

    const originalOrder = await prisma.order.findFirst({
      where,
      include: {
        customer: true,
        document: true,
      },
    });

    if (!originalOrder) {
      throw new AppError(`Original order '${orderId}' not found.`, 404, 'ORDER_NOT_FOUND');
    }

    if (user.role === UserRole.CUSTOMER && originalOrder.customerId !== user.id) {
      throw new AppError('Forbidden: Cannot reprint an order belonging to another customer.', 403, 'ACCESS_DENIED');
    }

    // Generate reprint order ID
    const reprintId = `#NF-${Math.floor(2000 + Math.random() * 7000)}`;

    const reprintTimeline = [
      {
        title: `Reprint Requested from ${originalOrder.id}`,
        description: 'Customer reprint authorized by system',
        time: 'Just now',
        completed: true,
      },
      {
        title: 'Payment Waived (Reprint)',
        description: 'Linked to parent verified payment transaction',
        time: 'Just now',
        completed: true,
      },
      {
        title: `Queued at Kiosk ${originalOrder.kioskId}`,
        description: 'Priority spooling in progress',
        time: 'Active',
        completed: false,
      },
      {
        title: 'Reprinting in Progress',
        description: `${originalOrder.copies} copies (${originalOrder.pageCount} pages, ${originalOrder.colorMode})`,
        time: 'Pending',
        completed: false,
      },
    ];

    const reprintOrder = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          id: reprintId,
          customerId: originalOrder.customerId,
          documentId: originalOrder.documentId,
          kioskId: originalOrder.kioskId,
          copies: originalOrder.copies,
          pageCount: originalOrder.pageCount,
          colorMode: originalOrder.colorMode,
          paperSize: originalOrder.paperSize,
          duplex: originalOrder.duplex,
          subtotal: originalOrder.subtotal,
          tax: originalOrder.tax,
          totalAmount: originalOrder.totalAmount,
          currency: originalOrder.currency,
          status: OrderStatus.Queued,
          paymentStatus: PaymentStatus.Paid,
          progress: 15,
          timeline: reprintTimeline,
        },
        include: {
          customer: { select: { id: true, email: true, displayName: true } },
          document: true,
        },
      });

      // Create linked PrintJob
      await tx.printJob.create({
        data: {
          orderId: ord.id,
          kioskId: ord.kioskId,
          status: 'QUEUED',
          progress: 15,
        },
      });

      // Increment kiosk queue length
      await tx.kiosk.update({
        where: { id: ord.kioskId },
        data: { queueLength: { increment: 1 } },
      });

      return ord;
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        actor: user.role === 'ADMIN' ? 'Administrator' : originalOrder.customer.email,
        actorRole: user.role,
        action: 'ORDER_REPRINT_REQUESTED',
        resource: `Order ${reprintOrder.id} (Reprint of ${originalOrder.id})`,
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        payload: {
          originalOrderId: originalOrder.id,
          reprintOrderId: reprintOrder.id,
          kioskId: reprintOrder.kioskId,
        },
      },
    });

    const formatted = this.formatOrder(reprintOrder);
    EventPublisher.publishOrderCreated(formatted);
    return formatted;
  }
}

export const ordersService = new OrdersService();

