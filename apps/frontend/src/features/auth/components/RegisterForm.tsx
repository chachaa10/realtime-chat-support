import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from '@repo/shared';
import { useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordRequirements } from '@/features/auth/components/PasswordRequirements';

import { useAuth } from '../context';

type RegisterInput = z.infer<typeof RegisterSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '', role: 'customer' },
  });

  const password = watch('password') ?? '';
  const selectedRole = watch('role');

  async function onSubmit(data: RegisterInput) {
    try {
      await registerUser(data.name, data.email, data.password, data.role);
      await navigate({ to: '/tickets' });
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Registration failed',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {errors.root && (
        <div className="bg-destructive/10 border-destructive/30 text-ink rounded-lg border px-4 py-3 text-[0.8125rem]">
          {errors.root.message}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-name">Name</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Your name"
          data-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <p className="text-destructive text-[0.8125rem]">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="text"
          placeholder="you@example.com"
          data-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-destructive text-[0.8125rem]">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-password">Password</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            data-invalid={!!errors.password}
            className="pr-9"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-8 w-9 items-center justify-center"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <PasswordRequirements value={password} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Account type</Label>
        <div className="flex gap-2">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[0.875rem] font-medium transition-colors ${
              selectedRole === 'customer'
                ? 'border-ink text-ink bg-ink/5'
                : 'border-border text-ink-muted hover:border-ink/30'
            }`}
          >
            <input
              type="radio"
              value="customer"
              {...register('role')}
              className="sr-only"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Customer
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[0.875rem] font-medium transition-colors ${
              selectedRole === 'agent'
                ? 'border-ink text-ink bg-ink/5'
                : 'border-border text-ink-muted hover:border-ink/30'
            }`}
          >
            <input
              type="radio"
              value="agent"
              {...register('role')}
              className="sr-only"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
            </svg>
            Agent
          </label>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
