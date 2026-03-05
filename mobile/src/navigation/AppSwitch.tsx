import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useParentOnboardingGate } from '../hooks/useParentOnboardingGate';
import { ParentNavigator } from './ParentNavigator';
import { ParentOnboardingNavigator } from './ParentOnboardingNavigator';
import { ChildNavigator } from './ChildNavigator';
import { AdminNavigator } from './AdminNavigator';
import { TherapistNavigator } from './TherapistNavigator';
import { ClinicNavigator } from './ClinicNavigator';
import { colors } from '../theme/colors';

/**
 * Renders Parent, Child, Therapist, Admin, or Clinic navigator based on app role.
 * Parents with no children and incomplete onboarding see ParentOnboarding first.
 */
export function AppSwitch() {
  const { appRole } = useAuth();
  const { showParentOnboarding, loading: gateLoading } = useParentOnboardingGate();

  if (appRole === 'admin') return <AdminNavigator />;
  if (appRole === 'therapist') return <TherapistNavigator />;
  if (appRole === 'clinic_admin') return <ClinicNavigator />;

  if (appRole === 'parent') {
    if (gateLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (showParentOnboarding) {
      return <ParentOnboardingNavigator />;
    }
    return <ParentNavigator />;
  }

  return <ChildNavigator />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
