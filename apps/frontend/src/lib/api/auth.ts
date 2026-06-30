import { post } from './client';

export interface AuthData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  session?: { id: string };
}

export function login(email: string, password: string): Promise<AuthData> {
  return post<AuthData>('/api/auth/sign-in/email', { email, password });
}

export function register(name: string, email: string, password: string): Promise<AuthData> {
  return post<AuthData>('/api/auth/sign-up/email', { name, email, password });
}
