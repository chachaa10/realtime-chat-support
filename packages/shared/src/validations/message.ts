import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.number(),
  ticketId: z.number(),
  authorId: z.string(),
  body: z
    .string()
    .min(1, { error: 'Message cannot be empty' })
    .max(10000, { error: 'Message must be at most 10000 characters' }),
  createdAt: z.number(),
});

export const SendMessageSchema = z.object({
  ticketId: z.number(),
  body: z
    .string()
    .min(1, { error: 'Message cannot be empty' })
    .max(10000, { error: 'Message must be at most 10000 characters' }),
  attachmentIds: z.array(z.number()).optional(),
});
