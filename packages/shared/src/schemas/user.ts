import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  role: z.enum(['customer', 'agent']),
  createdAt: z.number(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['customer', 'agent']),
});

export type User = z.infer<typeof UserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
