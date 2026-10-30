import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { EventPublisher } from '../realtime/events.js';
import { OrderStatus, PaymentStatus, PaymentState, PrintJobStatus, UserRole } from '@prisma/client';
import { ordersService } from '../orders/orders.service.js';

export class PaymentsService {
  /**
   * Process simulated payment with strict idempotency and atomic print job queue release
   */
  public async processSimulatedPayment(
    user: { id: string; role: UserRole; email: string },
    params: { orderId: string; idempotencyKey: string; cardLast4?: string }
  ) {
    const { orderId, idempotencyKey, cardLast4 = '4242' } = params;

    // 1. Idempotency Check: Has this idempotency key already been processed?
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey },
      include: {
        order: {
          include: { customer: true, document: true, payments: true, printJob: true },
        },
      },
    });

    if (existingPayment) {
      // Return existing payment idempotently without creating duplicate jobs!
      return {
        payment: existingPayment,
        order: ordersService.formatOrder(existingPayment.order),
        idempotentReplay: true,
      };
    }

    // 2. Fetch Order (robust case-insensitive and prefix-tolerant lookup)
    const raw = (orderId || '').trim();
    const upper = raw.toUpperCase();
    const withHash = upper.startsWith('#') ? upper : `#${upper}`;
    const withoutHash = upper.replace(/^#/, '');

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: { equals: withHash, mode: 'insensitive' } },
          { id: { equals: withoutHash, mode: 'insensitive' } },
          { id: withHash },
          { id: withoutHash },
          { id: raw },
        ],
      },
      include: { printJob: true, customer: true, document: true },
    });

    if (!order) {
      throw new AppError(`Order '${orderId}' not found.`, 404, 'ORDER_NOT_FOUND');
    }

    // Authorization check: Customer can only pay for their own order
    if (user.role === UserRole.CUSTOMER && order.customerId !== user.id) {
      throw new AppError('Forbidden: You cannot pay for an order that belongs to another customer.', 403, 'ACCESS_DENIED');
    }

    // Order state validation
    if (order.paymentStatus === PaymentStatus.Paid) {
      return {
        payment: null,
        order: ordersService.formatOrder(order),
        idempotentReplay: true,
      };
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new AppError(`Cannot pay for cancelled order '${orderId}'.`, 400, 'ORDER_CANCELLED');
    }

    // 3. Execute Transaction: Save payment, update order, enqueue print job, record audit log
    const providerPaymentRef = `sim_ch_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // Record Payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: 'SIMULATED',
          providerPaymentRef,
          amount: order.totalAmount,
          currency: order.currency,
          status: PaymentState.SUCCEEDED,
          idempotencyKey,
          processedAt: new Date(),
        },
      });

      // Update Order Status to Queued & PaymentStatus to Paid with updated timeline
      const updatedTimeline = [
        {
          title: 'Order Created',
          description: 'Received in system',
          time: 'Completed',
          completed: true,
        },
        {
          title: 'Payment & Authorization',
          description: `Simulated Visa ending ${cardLast4} authorized`,
          time: 'Completed',
          completed: true,
        },
        {
          title: `Spooling to Kiosk ${order.kioskId}`,
          description: 'Transmitting via high-speed queue',
          time: 'Active',
          completed: false,
        },
        {
          title: 'Printing in Progress',
          description: `${order.copies} cop${order.copies > 1 ? 'ies' : 'y'} (${order.pageCount} pages, ${order.colorMode})`,
          time: 'Pending',
          completed: false,
        },
      ];

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.Paid,
          status: OrderStatus.Queued,
          timeline: updatedTimeline,
        },
        include: {
          customer: true,
          document: true,
          payments: true,
          printJob: true,
        },
      });

      // Increment Kiosk queue length
      await tx.kiosk.update({
        where: { id: order.kioskId },
        data: {
          queueLength: { increment: 1 },
        },
      });

      // Create or release Print Job in QUEUED state (Guaranteed no duplicates via unique orderId!)
      const printJob = await tx.printJob.upsert({
        where: { orderId: order.id },
        update: {
          status: PrintJobStatus.QUEUED,
        },
        create: {
          orderId: order.id,
          kioskId: order.kioskId,
          status: PrintJobStatus.QUEUED,
          progress: 0,
        },
      });

      // Record Webhook/Payment event for audit & provider reconciliation
      await tx.paymentEvent.create({
        data: {
          eventId: `evt_${Date.now()}_${idempotencyKey}`,
          eventType: 'payment_intent.succeeded',
          payload: {
            orderId: order.id,
            amount: Number(order.totalAmount),
            providerPaymentRef,
            idempotencyKey,
          },
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          actor: user.email,
          actorRole: user.role === UserRole.ADMIN ? 'System Administrator' : 'Customer',
          action: 'PAYMENT_VERIFIED',
          resource: `Order ${order.id}`,
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          payload: {
            amount: Number(order.totalAmount),
            currency: order.currency,
            providerPaymentRef,
            jobId: printJob.id,
          },
        },
      });

      return { payment, updatedOrder, printJob };
    });

    const formattedOrder = ordersService.formatOrder(result.updatedOrder);

    // 4. Emit Real-time status updates to connected frontend clients
    EventPublisher.publishJobProgress({
      jobId: result.printJob.id,
      orderId: order.id,
      kioskId: order.kioskId,
      customerId: order.customerId,
      progress: 0,
      status: 'QUEUED',
      version: result.printJob.version,
    });

    EventPublisher.publishOrderUpdated({
      orderId: order.id,
      status: OrderStatus.Queued,
      paymentStatus: PaymentStatus.Paid,
      order: formattedOrder,
    });

    return {
      payment: result.payment,
      order: formattedOrder,
      job: result.printJob,
      idempotentReplay: false,
    };
  }
}

export const paymentsService = new PaymentsService();

