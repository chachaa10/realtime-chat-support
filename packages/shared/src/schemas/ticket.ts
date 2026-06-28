import { z } from 'zod';

export const TicketStatus = z.enum(['open', 'in_progress', 'resolved']);

export type TicketStatus = z.infer<typeof TicketStatus>;

export const TicketSchema = z.object({
  id: z.number(),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  status: TicketStatus,
  customerId: z.string(),
  agentId: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  resolvedAt: z.number().nullable(),
});

export const CreateTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

export type Ticket = z.infer<typeof TicketSchema>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
