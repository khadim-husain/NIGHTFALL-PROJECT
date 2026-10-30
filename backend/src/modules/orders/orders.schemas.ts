import { z } from 'zod';

export const quoteSchema = z.object({
  pageCount: z.number().int().min(1).max(5000),
  copies: z.number().int().min(1).max(100),
  colorMode: z.enum(['Color', 'Monochrome']),
  paperSize: z.enum(['A4', 'A3', 'Letter']),
  duplex: z.boolean().default(true),
});

export const createOrderSchema = z.object({
  documentId: z.string().min(1),
  kioskId: z.string().min(1),
  copies: z.number().int().min(1).max(100).default(1),
  pageCount: z.number().int().min(1).max(5000).optional(),
  colorMode: z.enum(['Color', 'Monochrome']).default('Color'),
  paperSize: z.enum(['A4', 'A3', 'Letter']).default('A4'),
  duplex: z.boolean().default(true),
  // Any client-provided price is discarded; server recalculates authoritative price!
  clientTotalAmount: z.number().optional(),
});

export const orderQuerySchema = z.object({
  status: z.enum(['Pending', 'Queued', 'Printing', 'Completed', 'Failed', 'Cancelled']).optional(),
  kioskId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

