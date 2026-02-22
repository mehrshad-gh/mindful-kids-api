import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ParentNavigator } from './ParentNavigator';
import { ChildNavigator } from './ChildNavigator';

/**
 * Renders Parent or Child navigator based on app role.
 * Role can be switched from Dashboard (Parent) or ActivityHub (Child) via setAppRole.
 */
export function AppSwitch() {
  const { appRole } = useAuth();
  return appRole === 'parent' ? <ParentNavigator /> : <ChildNavigator />;
}
