
'use client';

import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';

interface AuthContextType {
  user: User | null;
  login: (role: 'admin' | 'member') => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Este efecto solo se ejecuta en el cliente
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error al leer el usuario de localStorage", error);
      localStorage.removeItem('currentUser');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((role: 'admin' | 'member') => {
    const newUser: User = { role };
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    router.push('/'); 
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
