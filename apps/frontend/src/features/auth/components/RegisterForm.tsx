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

  async function onSubmit(data: RegisterInput) {
    try {
      await registerUser(data.name, data.email, data.password, 'customer');
      await navigate({ to: '/' });
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

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
