import { z } from 'zod';

import { ROLES } from '../constants';

export const ProfileSchema = z.object({
  id: z.string(),
  role: z.enum(ROLES, { error: 'Role must be either customer or agent' }),
  createdAt: z.number(),
});
