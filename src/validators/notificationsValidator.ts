import { z } from 'zod';

export const sendTestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  idempotencyKey: z.string().min(1).optional(),
});

export const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'ids required'),
});
