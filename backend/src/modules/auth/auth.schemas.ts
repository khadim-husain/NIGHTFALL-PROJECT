import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  displayName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['CUSTOMER', 'OPERATOR', 'ADMIN']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const demoTokenSchema = z.object({
  email: z.string().email().optional().default('admin@nightfall.io'),
});
