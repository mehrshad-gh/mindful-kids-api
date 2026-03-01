import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ParentNavigator } from './ParentNavigator';
import { ChildNavigator } from './ChildNavigator';
import { AdminNavigator } from './AdminNavigator';
import { TherapistNavigator } from './TherapistNavigator';
import { ClinicNavigator } from './ClinicNavigator';

/**
 * Renders Parent, Child, Therapist, Admin, or Clinic navigator based on app role.
 */
export function AppSwitch() {
  const { appRole } = useAuth();
  if (appRole === 'admin') return <AdminNavigator />;
  if (appRole === 'therapist') return <TherapistNavigator />;
  if (appRole === 'clinic_admin') return <ClinicNavigator />;
  return appRole === 'parent' ? <ParentNavigator /> : <ChildNavigator />;
}
