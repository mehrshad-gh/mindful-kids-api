import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChildren } from './useChildren';
import { getParentOnboardingComplete } from '../utils/onboardingStorage';

/**
 * When true, show ParentOnboarding stack instead of Parent tabs.
 * Gate: parent role + no children + parent onboarding not yet completed.
 */
export function useParentOnboardingGate(): { showParentOnboarding: boolean; loading: boolean } {
  const { appRole } = useAuth();
  const { children, loading: childrenLoading } = useChildren();
  const [parentComplete, setParentComplete] = useState<boolean | null>(null);

  useEffect(() => {
    getParentOnboardingComplete().then(setParentComplete);
  }, []);

  const isParent = appRole === 'parent';
  const noChildren = children.length === 0;
  const loading = isParent && (childrenLoading || parentComplete === null);
  const showParentOnboarding = isParent && !childrenLoading && noChildren && parentComplete !== true;

  return { showParentOnboarding, loading };
}
