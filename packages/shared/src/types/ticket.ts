import type { z } from 'zod';

import type {
  TicketSchema as TicketValidation,
  CreateTicketSchema,
  TicketStatus as TicketStatusEnum,
} from '../validations/ticket-validation';

export type Ticket = z.infer<typeof TicketValidation>;
export type TicketStatus = z.infer<typeof TicketStatusEnum>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export interface TicketWithLabels extends Ticket {
  labels?: import('./label').Label[];
}
