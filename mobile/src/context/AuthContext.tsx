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
  register: (email: string, password: string, name: string, role?: 'parent' | 'therapist' | 'clinic_admin') => Promise<void>;
  logout: () => Promise<void>;
  setAppRole: (role: UserRole) => void;
  setSelectedChild: (childId: string | null) => void;
  setPendingActivityId: (activityId: string | null) => void;
  /** Re-load user from token (e.g. after set-password-from-invite). */
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(u: { id: string; email: string; name: string; role: string }): User {
  const role = u.role as User['role'];
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: role === 'admin' || role === 'therapist' || role === 'clinic_admin' ? role : 'parent',
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
        const normalized = normalizeUser(me);
        if (!cancelled) {
          setUser(normalized);
          setAppRoleState(normalized.role === 'admin' ? 'admin' : normalized.role === 'therapist' ? 'therapist' : 'parent');
        }
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

  const refreshAuth = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { user: me } = await authService.getMe();
      const normalized = normalizeUser(me);
      setUser(normalized);
      setAppRoleState(normalized.role === 'admin' ? 'admin' : normalized.role === 'therapist' ? 'therapist' : 'parent');
    } catch {
      setUser(null);
    }
  }, []);

  const setOnboardingComplete = useCallback(async (complete: boolean) => {
    setOnboardingCompleteState(complete);
    await persistOnboardingComplete(complete);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: u } = await authService.login({ email, password });
      const normalized = normalizeUser(u);
      setUser(normalized);
      setAppRoleState(normalized.role === 'admin' ? 'admin' : normalized.role === 'therapist' ? 'therapist' : 'parent');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, role?: 'parent' | 'therapist' | 'clinic_admin') => {
      setIsLoading(true);
      try {
        const { user: u } = await authService.register({ email, password, name, role });
        const normalized = normalizeUser(u);
        setUser(normalized);
        setAppRoleState(normalized.role === 'admin' ? 'admin' : normalized.role === 'therapist' ? 'therapist' : 'parent');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
      refreshAuth,
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
      refreshAuth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
