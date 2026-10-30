import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  actor: z.string().optional(),
  action: z.string().optional(),
  status: z.enum(['SUCCESS', 'WARNING', 'FAILED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

