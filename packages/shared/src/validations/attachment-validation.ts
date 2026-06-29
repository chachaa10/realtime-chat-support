import { z } from 'zod';

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
