import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string(),
  role: z.enum(['customer', 'agent'], { error: 'Role must be either customer or agent' }),
  createdAt: z.number(),
});
