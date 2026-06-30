import { z } from 'zod';

import { TICKET_STATUSES } from '../constants';

export const TicketStatus = z.enum(TICKET_STATUSES, {
  error: 'Status must be one of: open, in_progress, resolved, cancelled',
});

export const TicketSchema = z.object({
  id: z.number(),
  subject: z
    .string()
    .min(1, { error: 'Subject is required' })
    .max(200, { error: 'Subject must be at most 200 characters' }),
  description: z
    .string()
    .min(1, { error: 'Description is required' })
    .max(5000, { error: 'Description must be at most 5000 characters' }),
  status: TicketStatus,
  customerId: z.string(),
  agentId: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  resolvedAt: z.number().nullable(),
  cancelledAt: z.number().nullable(),
});

export const CreateTicketSchema = z.object({
  subject: z
    .string()
    .min(1, { error: 'Subject is required' })
    .max(200, { error: 'Subject must be at most 200 characters' }),
  description: z
    .string()
    .min(1, { error: 'Description is required' })
    .max(5000, { error: 'Description must be at most 5000 characters' }),
  labelIds: z.array(z.number()).optional(),
});
