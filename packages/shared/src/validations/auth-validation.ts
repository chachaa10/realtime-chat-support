import { z } from 'zod';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_RULES } from './password-rules';

export const LoginSchema = z.object({
  email: z.email({ error: 'Invalid email format' }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, {
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    })
    .max(PASSWORD_MAX_LENGTH, {
      error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    }),
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must be at most 100 characters' }),
  email: z.email({ error: 'Invalid email format' }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, {
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    })
    .max(PASSWORD_MAX_LENGTH, {
      error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    })
    .refine((v) => PASSWORD_RULES.every((r) => r.test(v)), {
      message: 'Password does not meet all requirements',
    }),
  role: z.enum(['customer', 'agent'], { error: 'Role must be either customer or agent' }),
});
