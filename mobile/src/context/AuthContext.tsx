import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole } from '../types/auth';
import { getToken } from '../services/tokenStorage';
import { getOnboardingComplete, setOnboardingComplete as persistOnboardingComplete } from '../services/onboardingStorage';
import * as authService from '../services/authService';
import { getRequiredAcceptances } from '../api/legalGate';
import { setAccountDeactivatedHandler, setLegalReacceptRequiredHandler } from '../lib/apiClient';

export interface LegalGateMissingItem {
  document_type: string;
  document_version: string;
}

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
  /** When non-null and length > 0, app must show LegalReacceptGateScreen until user accepts. */
  legalGateMissing: LegalGateMissingItem[] | null;
  /** Clear legal gate after user has accepted all missing (or to retry check). */
  setLegalGateMissing: (missing: LegalGateMissingItem[] | null) => void;
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
  /** True after 401 "Account is deactivated" – show deactivated screen then clear. */
  accountDeactivated: boolean;
  clearAccountDeactivated: () => void;
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
  const [accountDeactivated, setAccountDeactivatedState] = useState(false);
  const [legalGateMissing, setLegalGateMissingState] = useState<LegalGateMissingItem[] | null>(null);

  const setLegalGateMissing = useCallback((missing: LegalGateMissingItem[] | null) => {
    setLegalGateMissingState(missing);
  }, []);

  const fetchLegalGate = useCallback(async () => {
    try {
      const { missing } = await getRequiredAcceptances();
      setLegalGateMissingState(missing.length > 0 ? missing : null);
    } catch {
      setLegalGateMissingState(null);
    }
  }, []);

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
          setAppRoleState(
          normalized.role === 'admin' ? 'admin' :
          normalized.role === 'therapist' ? 'therapist' :
          normalized.role === 'clinic_admin' ? 'clinic_admin' : 'parent'
        );
          await fetchLegalGate();
          if (cancelled) return;
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
  }, [fetchLegalGate]);

  const refreshAuth = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { user: me } = await authService.getMe();
      const normalized = normalizeUser(me);
      setUser(normalized);
      setAppRoleState(
          normalized.role === 'admin' ? 'admin' :
          normalized.role === 'therapist' ? 'therapist' :
          normalized.role === 'clinic_admin' ? 'clinic_admin' : 'parent'
        );
      await fetchLegalGate();
    } catch {
      setUser(null);
      setLegalGateMissingState(null);
    }
  }, [fetchLegalGate]);

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
      setAppRoleState(
          normalized.role === 'admin' ? 'admin' :
          normalized.role === 'therapist' ? 'therapist' :
          normalized.role === 'clinic_admin' ? 'clinic_admin' : 'parent'
        );
      await fetchLegalGate();
    } finally {
      setIsLoading(false);
    }
  }, [fetchLegalGate]);

  const register = useCallback(
    async (email: string, password: string, name: string, role?: 'parent' | 'therapist' | 'clinic_admin') => {
      setIsLoading(true);
      try {
        const { user: u } = await authService.register({ email, password, name, role });
        const normalized = normalizeUser(u);
        setUser(normalized);
        setAppRoleState(
          normalized.role === 'admin' ? 'admin' :
          normalized.role === 'therapist' ? 'therapist' :
          normalized.role === 'clinic_admin' ? 'clinic_admin' : 'parent'
        );
        await fetchLegalGate();
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLegalGate]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAppRoleState('parent');
    setSelectedChildId(null);
    setPendingActivityIdState(null);
    setLegalGateMissingState(null);
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

  const clearAccountDeactivated = useCallback(() => setAccountDeactivatedState(false), []);

  useEffect(() => {
    setAccountDeactivatedHandler(() => {
      authService.logout().then(() => {
        setUser(null);
        setAppRoleState('parent');
        setSelectedChildId(null);
        setPendingActivityIdState(null);
        setAccountDeactivatedState(true);
      });
    });
    setLegalReacceptRequiredHandler((missing) => {
      setLegalGateMissingState(missing);
    });
    return () => {
      setAccountDeactivatedHandler(null);
      setLegalReacceptRequiredHandler(null);
    };
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
      legalGateMissing,
      setLegalGateMissing,
      setOnboardingComplete,
      login,
      register,
      logout,
      setAppRole,
      setSelectedChild,
      setPendingActivityId,
      refreshAuth,
      accountDeactivated,
      clearAccountDeactivated,
    }),
    [
      user,
      appRole,
      selectedChildId,
      pendingActivityId,
      isLoading,
      isRestoring,
      onboardingComplete,
      legalGateMissing,
      setLegalGateMissing,
      setOnboardingComplete,
      login,
      register,
      logout,
      setAppRole,
      setSelectedChild,
      setPendingActivityId,
      refreshAuth,
      accountDeactivated,
      clearAccountDeactivated,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
