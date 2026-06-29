import type { z } from 'zod';

import type { LoginSchema, RegisterSchema } from '../validations/auth-validation';

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
