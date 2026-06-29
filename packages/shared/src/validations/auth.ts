import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ error: 'Invalid email format' }),
  password: z.string().min(8, { error: 'Password must be at least 8 characters' }).max(128, { error: 'Password must be at most 128 characters' }),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }).max(100, { error: 'Name must be at most 100 characters' }),
  email: z.string().email({ error: 'Invalid email format' }),
  password: z.string().min(8, { error: 'Password must be at least 8 characters' }).max(128, { error: 'Password must be at most 128 characters' }),
  role: z.enum(['customer', 'agent'], { error: 'Role must be either customer or agent' }),
});
