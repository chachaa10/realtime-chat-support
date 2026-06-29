import type { z } from 'zod';

import type { TicketSchema as TicketValidation, CreateTicketSchema, TicketStatus as TicketStatusEnum } from '../validations/ticket';

export type Ticket = z.infer<typeof TicketValidation>;
export type TicketStatus = z.infer<typeof TicketStatusEnum>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
