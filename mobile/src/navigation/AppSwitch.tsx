import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ParentNavigator } from './ParentNavigator';
import { ChildNavigator } from './ChildNavigator';
import { AdminNavigator } from './AdminNavigator';

/**
 * Renders Parent, Child, or Admin navigator based on app role.
 */
export function AppSwitch() {
  const { appRole } = useAuth();
  if (appRole === 'admin') return <AdminNavigator />;
  return appRole === 'parent' ? <ParentNavigator /> : <ChildNavigator />;
}
