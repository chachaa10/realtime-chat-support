import { RegisterSchema } from '@repo/shared';
import { useState } from 'react';

import { useAuth } from '../context';

export function RegisterForm() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'agent'>('customer');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = RegisterSchema.safeParse({ name, email, password, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      await register(name, email, password, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <select value={role} onChange={(e) => setRole(e.target.value as 'customer' | 'agent')}>
        <option value="customer">Customer</option>
        <option value="agent">Agent</option>
      </select>
      <button type="submit">Register</button>
    </form>
  );
}
