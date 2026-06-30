import { z } from 'zod';

export const LabelSchema = z.object({
  id: z.number(),
  name: z
    .string()
    .min(1, { error: 'Label name is required' })
    .max(50, { error: 'Label name must be at most 50 characters' }),
  color: z
    .string()
    .min(4, { error: 'Label color is required' })
    .max(7, { error: 'Label color must be a hex color' }),
});

export const TicketLabelSchema = z.object({
  ticketId: z.number(),
  labelId: z.number(),
});
