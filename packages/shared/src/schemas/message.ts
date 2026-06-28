import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.number(),
  ticketId: z.number(),
  authorId: z.string(),
  body: z.string().min(1).max(10000),
  createdAt: z.number(),
});

export const SendMessageSchema = z.object({
  ticketId: z.number(),
  body: z.string().min(1).max(10000),
  attachmentIds: z.array(z.number()).optional(),
});

export const AttachmentSchema = z.object({
  id: z.number(),
  messageId: z.number().nullable(),
  ticketId: z.number(),
  uploaderId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  filePath: z.string(),
  createdAt: z.number(),
});

export type Message = z.infer<typeof MessageSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
