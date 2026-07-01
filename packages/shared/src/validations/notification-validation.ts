import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.string(),
  type: z.enum([
    'ticket_assigned',
    'ticket_resolved',
    'ticket_cancelled',
    'ticket_returned',
    'new_message',
  ]),
  ticketId: z.number(),
  message: z.string(),
  isRead: z.number(),
  createdAt: z.number(),
});

export const NotificationType = z.enum([
  'ticket_assigned',
  'ticket_resolved',
  'ticket_cancelled',
  'ticket_returned',
  'new_message',
]);
