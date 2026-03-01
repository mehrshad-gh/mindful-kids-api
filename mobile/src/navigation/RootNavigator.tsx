import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { TherapistOnboardingNavigator } from './TherapistOnboardingNavigator';
import { AppSwitch } from './AppSwitch';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isAuthenticated, isRestoring, onboardingComplete } = useAuth();

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingNavigator}
          initialParams={{ initialRouteName: onboardingComplete ? 'Login' : 'Welcome' }}
        />
        <Stack.Screen name="TherapistOnboarding" component={TherapistOnboardingNavigator} />
      </Stack.Navigator>
    );
  }

  if (user?.role === 'therapist' && !onboardingComplete) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="TherapistOnboarding"
          component={TherapistOnboardingNavigator}
          initialParams={{ initialScreen: 'TherapistProfessional' }}
        />
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        <Stack.Screen name="App" component={AppSwitch} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      key="authenticated"
      screenOptions={{ headerShown: false }}
      initialRouteName="App"
    >
      <Stack.Screen name="App" component={AppSwitch} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      {user?.role === 'therapist' && (
        <Stack.Screen name="TherapistOnboarding" component={TherapistOnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
