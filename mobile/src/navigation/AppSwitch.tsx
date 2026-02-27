import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ParentNavigator } from './ParentNavigator';
import { ChildNavigator } from './ChildNavigator';
import { AdminNavigator } from './AdminNavigator';
import { TherapistNavigator } from './TherapistNavigator';

/**
 * Renders Parent, Child, Therapist, or Admin navigator based on app role.
 */
export function AppSwitch() {
  const { appRole } = useAuth();
  if (appRole === 'admin') return <AdminNavigator />;
  if (appRole === 'therapist') return <TherapistNavigator />;
  return appRole === 'parent' ? <ParentNavigator /> : <ChildNavigator />;
}
