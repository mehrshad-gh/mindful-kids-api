import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { User, UserRole } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  appRole: UserRole;
  selectedChildId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setAppRole: (role: UserRole) => void;
  setSelectedChild: (childId: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appRole, setAppRoleState] = useState<UserRole>('parent');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Call mindful-kids-api POST /auth/login
      const mockUser: User = {
        id: '1',
        email,
        name: 'Parent User',
        role: 'parent',
      };
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // TODO: Call mindful-kids-api POST /auth/register
      const mockUser: User = { id: '1', email, name, role: 'parent' };
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAppRoleState('parent');
    setSelectedChildId(null);
  }, []);

  const setAppRole = useCallback((role: UserRole) => {
    setAppRoleState(role);
  }, []);

  const setSelectedChild = useCallback((childId: string | null) => {
    setSelectedChildId(childId);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      appRole,
      selectedChildId,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      setAppRole,
      setSelectedChild,
    }),
    [
      user,
      appRole,
      selectedChildId,
      isLoading,
      login,
      register,
      logout,
      setAppRole,
      setSelectedChild,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
