import { get, post, patch } from './client';

export interface AuthData {
  token?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'agent';
  };
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent';
}

export function login(email: string, password: string): Promise<AuthData> {
  return post<AuthData>('/api/auth/sign-in/email', { email, password });
}

export function signUp(name: string, email: string, password: string): Promise<AuthData> {
  return post<AuthData>('/api/auth/sign-up/email', { name, email, password });
}

export function fetchProfile(): Promise<ProfileData> {
  return get<ProfileData>('/auth/profile');
}

export function updateAvailability(status: 'online' | 'away'): Promise<{ status: string }> {
  return patch<{ status: string }>('/auth/profile/availability', { status });
}
