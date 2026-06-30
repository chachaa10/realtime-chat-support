import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

import { loginApi, registerApi } from './utils/authClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent';
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password);
    const prev = localStorage.getItem('user');
    const prevUser = prev ? JSON.parse(prev) : {};
    const userWithRole = { ...data.user, role: prevUser.role ?? 'customer' };
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: 'customer' | 'agent') => {
      const data = await registerApi(name, email, password, role);
      const userWithRole = { ...data.user, role };
      localStorage.setItem('user', JSON.stringify(userWithRole));
      setUser(userWithRole);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
