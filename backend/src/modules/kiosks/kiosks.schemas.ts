import { z } from 'zod';

export const kioskHeartbeatSchema = z.object({
  temperature: z.number().min(0).max(100).optional(),
  paperLevel: z.number().min(0).max(100).optional(),
  inkLevel: z.number().min(0).max(100).optional(),
  status: z.enum(['Online', 'Idle', 'Busy', 'Offline', 'Error']).optional(),
});

export const kioskProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  sequence: z.number().int().optional(),
  temperature: z.number().optional(),
  paperLevel: z.number().optional(),
  inkLevel: z.number().optional(),
});

export const kioskCompleteSchema = z.object({
  notes: z.string().optional(),
});

export const kioskFailSchema = z.object({
  reason: z.string().min(1),
  isUncertain: z.boolean().default(false), // Exactly-once physical printing protection
  sensorDetails: z.record(z.any()).optional(),
});

