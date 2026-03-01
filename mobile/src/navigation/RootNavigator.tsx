import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Linking } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { TherapistOnboardingNavigator } from './TherapistOnboardingNavigator';
import { AppSwitch } from './AppSwitch';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const SCHEME = 'mindfulkids';

function parseSetPasswordLink(url: string | null): { token: string } | null {
  if (!url || !url.includes('set-password')) return null;
  try {
    const u = url.startsWith(SCHEME + '://') ? url : url.replace(/^.*:\/\//, SCHEME + '://');
    const parsed = new URL(u.replace(SCHEME + '://', 'https://placeholder/'));
    const token = parsed.searchParams.get('token');
    return token ? { token } : null;
  } catch {
    return null;
  }
}

export function RootNavigator() {
  const { user, isAuthenticated, isRestoring, onboardingComplete } = useAuth();
  const [deepLink, setDeepLink] = useState<{ token: string } | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const parsed = parseSetPasswordLink(url);
      if (parsed) setDeepLink(parsed);
    });
    const sub = Linking.addEventListener('url', (e) => {
      const parsed = parseSetPasswordLink(e.url);
      if (parsed) setDeepLink(parsed);
    });
    return () => sub.remove();
  }, []);

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    const onboardingInitial =
      deepLink?.token != null
        ? { initialRouteName: 'SetPassword' as const, token: deepLink.token }
        : { initialRouteName: (onboardingComplete ? 'Login' : 'Welcome') as const };
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingNavigator}
          initialParams={onboardingInitial}
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
