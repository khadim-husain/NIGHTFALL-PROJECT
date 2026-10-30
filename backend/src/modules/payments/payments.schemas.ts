import { z } from 'zod';

export const simulatePaymentSchema = z.object({
  orderId: z.string().min(1),
  idempotencyKey: z.string().min(8),
  cardLast4: z.string().length(4).optional().default('4242'),
  paymentMethod: z.enum(['card', 'apple_pay', 'google_pay']).default('card'),
});

export const webhookEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(['payment_intent.succeeded', 'payment_intent.payment_failed']),
  data: z.object({
    orderId: z.string(),
    amount: z.number(),
    currency: z.string().default('USD'),
  }),
});

