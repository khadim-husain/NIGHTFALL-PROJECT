import { z } from 'zod';

export const createIncidentSchema = z.object({
  kioskId: z.string().min(1),
  zone: z.string().min(1),
  severity: z.enum(['Error', 'Warning', 'Info']),
  title: z.string().min(1),
  description: z.string().min(1),
  reportedBy: z.string().optional().default('Operator'),
});

export const incidentQuerySchema = z.object({
  status: z.enum(['Open', 'In_Progress', 'Resolved']).optional(),
  severity: z.enum(['Error', 'Warning', 'Info']).optional(),
  kioskId: z.string().optional(),
});

