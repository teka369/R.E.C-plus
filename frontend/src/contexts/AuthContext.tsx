import React, { createContext, useContext, useMemo, useState } from 'react';
import api, { setAuthToken } from '@/lib/api';

export type UserRole = 'profesor' | 'estudiante' | 'secretario' | 'admin' | string;

interface User {
  id: number | string;
  nombre?: string;
  apellido?: string;
  correo?: string;
  tipo?: UserRole;
  [key: string]: any;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const resp = await api.post('/login', { email, password });
      const data = resp.data;
      const ok = !!(data?.success ?? true); // algunos endpoints no usan 'success'
      const tokenValue = data?.token || data?.data?.token || data?.access_token;
      const userValue: User = data?.user || data?.data?.user || data?.data || {};
      if (!tokenValue) {
        return { success: false, message: 'No se recibió token de autenticación.' };
      }
      setAuthToken(tokenValue);
      setToken(tokenValue);
      setUser(userValue);
      setRole((userValue?.tipo as UserRole) || null);
      return { success: ok };
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al iniciar sesión.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const value = useMemo<AuthContextType>(() => ({ token, user, role, loading, login, logout }), [token, user, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};