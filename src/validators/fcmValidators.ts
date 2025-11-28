import { z } from 'zod';

export const registerFcmSchema = z.object({
  token: z.string().min(1, 'FCM Token is required'),
  platform: z.enum(['android', 'ios']).optional(),
  meta: z.record(z.string(), z.any()).optional(), // ✅ Fixed: specify key type
});

export const deleteFcmSchema = z.object({
  token: z.string().min(1, 'FCM Token is required'),
});