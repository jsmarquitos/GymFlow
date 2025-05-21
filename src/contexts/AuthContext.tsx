
'use client';

import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Simularemos una "base de datos" de usuarios en localStorage
const USERS_STORAGE_KEY = 'gymUsers';
// Clave para el usuario actualmente logueado
const CURRENT_USER_STORAGE_KEY = 'currentUser';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string, roleOverride?: 'admin' | 'instructor') => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Contraseñas simuladas para admin e instructor (en una app real, esto sería hasheado y en backend)
const MOCK_ADMIN_PASS = "admin123";
const MOCK_INSTRUCTOR_PASS = "instructor123";
const MOCK_MEMBER_PASS = "member123"; // Contraseña por defecto para el miembro@gymflow.com

const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error al leer usuarios de localStorage", error);
    return [];
  }
};

const storeUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error al guardar usuarios en localStorage", error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Cargar usuarios mock iniciales si no existen
    if (typeof window !== 'undefined') {
      let users = getStoredUsers();
      if (users.length === 0) {
        users = [
          { id: 'admin_user', email: 'admin@gymflow.com', role: 'admin', name: 'Admin User' },
          { id: 'instructor_user', email: 'instructor@gymflow.com', role: 'instructor', name: 'Instructor User' },
          { id: 'member_user_mock', email: 'miembro@gymflow.com', role: 'member', name: 'Miembro de Prueba' },
        ];
        storeUsers(users);
      }
      // Cargar usuario actual
      try {
        const storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (storedCurrentUser) {
          setUser(JSON.parse(storedCurrentUser));
        }
      } catch (error) {
        console.error("Error al leer currentUser de localStorage", error);
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string, roleOverride?: 'admin' | 'instructor'): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay de red

    if (roleOverride === 'admin' && email === 'admin@gymflow.com') {
       // Para el login rápido de admin sin pass desde LoginClient
       const adminUser: User = { id: 'admin_user', email: 'admin@gymflow.com', role: 'admin', name: 'Admin User' };
       setUser(adminUser);
       localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(adminUser));
       setIsLoading(false);
       router.push('/');
       return { success: true };
    }
    if (roleOverride === 'instructor' && email === 'instructor@gymflow.com') {
      // Para el login rápido de instructor sin pass desde LoginClient
      const instructorUser: User = { id: 'instructor_user', email: 'instructor@gymflow.com', role: 'instructor', name: 'Instructor User' };
      setUser(instructorUser);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(instructorUser));
      setIsLoading(false);
      router.push('/');
      return { success: true };
    }

    // Login con email/password
    const users = getStoredUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    let isValidPassword = false;
    if (foundUser) {
      if (foundUser.email === 'admin@gymflow.com' && password === MOCK_ADMIN_PASS) isValidPassword = true;
      else if (foundUser.email === 'instructor@gymflow.com' && password === MOCK_INSTRUCTOR_PASS) isValidPassword = true;
      else if (foundUser.email === 'miembro@gymflow.com' && password === MOCK_MEMBER_PASS) isValidPassword = true;
      // Para usuarios registrados, en una app real, compararíamos con un hash de contraseña
      // Aquí, si es un usuario registrado (no admin/instructor hardcodeado) y se proporciona contraseña, la aceptamos (simulación)
      else if (foundUser.role === 'member' && password) isValidPassword = true; // Simulación para usuarios registrados
    }
    
    if (foundUser && isValidPassword) {
      setUser(foundUser);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(foundUser));
      router.push('/');
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, message: 'Correo electrónico o contraseña incorrectos.' };
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay de red

    let users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      setIsLoading(false);
      return { success: false, message: 'Este correo electrónico ya está registrado.' };
    }

    const newUser: User = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      role: 'member', // Nuevos registros son siempre miembros
    };
    // En una app real, aquí guardaríamos la contraseña hasheada
    users.push(newUser);
    storeUsers(users);
    setUser(newUser); // Auto-login después del registro
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
    router.push('/');
    setIsLoading(false);
    return { success: true };
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, register }}>
      {children}
    </AuthContext.Provider>
  );
}
