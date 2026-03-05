import React, { createContext, useContext, useState, useCallback } from 'react';

export interface OnboardingSuccessBanner {
  domainTitle: string;
  childName: string;
}

interface ParentOnboardingSuccessContextValue {
  banner: OnboardingSuccessBanner | null;
  setBanner: (b: OnboardingSuccessBanner | null) => void;
  clearBanner: () => void;
}

const ParentOnboardingSuccessContext = createContext<ParentOnboardingSuccessContextValue | null>(null);

export function ParentOnboardingSuccessProvider({ children }: { children: React.ReactNode }) {
  const [banner, setBannerState] = useState<OnboardingSuccessBanner | null>(null);
  const setBanner = useCallback((b: OnboardingSuccessBanner | null) => setBannerState(b), []);
  const clearBanner = useCallback(() => setBannerState(null), []);
  const value = React.useMemo(
    () => ({ banner, setBanner, clearBanner }),
    [banner, setBanner, clearBanner]
  );
  return (
    <ParentOnboardingSuccessContext.Provider value={value}>
      {children}
    </ParentOnboardingSuccessContext.Provider>
  );
}

export function useParentOnboardingSuccess() {
  const ctx = useContext(ParentOnboardingSuccessContext);
  if (!ctx) return { banner: null, setBanner: () => {}, clearBanner: () => {} };
  return ctx;
}
