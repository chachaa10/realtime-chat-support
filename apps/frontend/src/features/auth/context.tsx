import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

import { updateAvailability as updateAvailabilityApi } from '@/lib/api/auth';

import * as authApi from '@/lib/api/auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent';
  status?: 'online' | 'away';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'agent',
  ) => Promise<void>;
  logout: () => void;
  updateUserStatus: (status: 'online' | 'away') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    const profile = await authApi.fetchProfile();
    const userWithRole = { ...data.user, role: profile.role };
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: 'customer' | 'agent') => {
      const data = await authApi.signUp(name, email, password);
      const userWithRole = { ...data.user, role };
      localStorage.setItem('user', JSON.stringify(userWithRole));
      setUser(userWithRole);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const updateUserStatus = useCallback(async (status: 'online' | 'away') => {
    await updateAvailabilityApi(status);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, status };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
