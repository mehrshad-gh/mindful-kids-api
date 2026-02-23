import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole } from '../types/auth';
import { getToken } from '../services/tokenStorage';
import { getOnboardingComplete, setOnboardingComplete as persistOnboardingComplete } from '../services/onboardingStorage';
import * as authService from '../services/authService';

interface AuthContextValue {
  user: User | null;
  appRole: UserRole;
  selectedChildId: string | null;
  /** When set, child mode will open this activity (e.g. from advice "Try this with your child"). */
  pendingActivityId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  /** Onboarding completed and persisted; when false, show onboarding flow. */
  onboardingComplete: boolean;
  /** Mark onboarding complete and persist. */
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setAppRole: (role: UserRole) => void;
  setSelectedChild: (childId: string | null) => void;
  setPendingActivityId: (activityId: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(u: { id: string; email: string; name: string; role: string }): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role === 'admin' ? 'admin' : 'parent',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appRole, setAppRoleState] = useState<UserRole>('parent');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pendingActivityId, setPendingActivityIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [token, complete] = await Promise.all([getToken(), getOnboardingComplete()]);
        if (token && !complete) {
          if (!cancelled) setOnboardingCompleteState(true);
          await persistOnboardingComplete(true);
        } else if (!cancelled) {
          setOnboardingCompleteState(complete);
        }
        if (!token || cancelled) {
          if (!cancelled) setIsRestoring(false);
          return;
        }
        const { user: me } = await authService.getMe();
        if (!cancelled) setUser(normalizeUser(me));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setOnboardingComplete = useCallback(async (complete: boolean) => {
    setOnboardingCompleteState(complete);
    await persistOnboardingComplete(complete);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: u } = await authService.login({ email, password });
      setUser(normalizeUser(u));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { user: u } = await authService.register({ email, password, name });
      setUser(normalizeUser(u));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAppRoleState('parent');
    setSelectedChildId(null);
    setPendingActivityIdState(null);
  }, []);

  const setAppRole = useCallback((role: UserRole) => {
    setAppRoleState(role);
  }, []);

  const setSelectedChild = useCallback((childId: string | null) => {
    setSelectedChildId(childId);
  }, []);

  const setPendingActivityId = useCallback((activityId: string | null) => {
    setPendingActivityIdState(activityId);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      appRole,
      selectedChildId,
      pendingActivityId,
      isAuthenticated: !!user,
      isLoading,
      isRestoring,
      onboardingComplete,
      setOnboardingComplete,
      login,
      register,
      logout,
      setAppRole,
      setSelectedChild,
      setPendingActivityId,
    }),
    [
      user,
      appRole,
      selectedChildId,
      pendingActivityId,
      isLoading,
      isRestoring,
      onboardingComplete,
      setOnboardingComplete,
      login,
      register,
      logout,
      setAppRole,
      setSelectedChild,
      setPendingActivityId,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
