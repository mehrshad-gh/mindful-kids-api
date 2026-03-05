import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Linking } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { TherapistOnboardingNavigator } from './TherapistOnboardingNavigator';
import { AppSwitch } from './AppSwitch';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { AccountDeactivatedScreen } from '../screens/auth/AccountDeactivatedScreen';
import { LegalReacceptGateScreen } from '../screens/auth/LegalReacceptGateScreen';
import { SafetyHelpScreen } from '../screens/safety/SafetyHelpScreen';
import { TermsOfServiceScreen } from '../screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { ProfessionalDisclaimerScreen } from '../screens/legal/ProfessionalDisclaimerScreen';
import { ProviderTermsScreen } from '../screens/legal/ProviderTermsScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

type LegalGateStackParamList = {
  LegalReacceptGate: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
  ProviderTerms: undefined;
};
const LegalGateStack = createNativeStackNavigator<LegalGateStackParamList>();

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

/** Conditional flows (legal gate, auth, app). SafetyHelp is NOT registered here – only in the single root stack. */
function RootMainContent({ deepLink }: { deepLink: { token: string } | null }) {
  const { user, isAuthenticated, isRestoring, onboardingComplete, accountDeactivated, legalGateMissing } = useAuth();

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated && legalGateMissing && legalGateMissing.length > 0) {
    return (
      <LegalGateStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="LegalReacceptGate">
        <LegalGateStack.Screen name="LegalReacceptGate" component={LegalReacceptGateScreen} />
        <LegalGateStack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
        <LegalGateStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
        <LegalGateStack.Screen name="ProfessionalDisclaimer" component={ProfessionalDisclaimerScreen} options={{ title: 'Professional Disclaimer' }} />
        <LegalGateStack.Screen name="ProviderTerms" component={ProviderTermsScreen} options={{ title: 'Provider Terms' }} />
      </LegalGateStack.Navigator>
    );
  }

  if (!isAuthenticated) {
    if (accountDeactivated) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AccountDeactivated" component={AccountDeactivatedScreen} />
        </Stack.Navigator>
      );
    }
    const onboardingInitial =
      deepLink?.token != null
        ? { initialRouteName: 'SetPassword' as const, token: deepLink.token }
        : { initialRouteName: 'AuthLanding' as const };
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

/**
 * Single root stack: SafetyHelp registered once. All conditional flows live under Main.
 * Prevents duplication bugs and ensures navigate('SafetyHelp') always targets this screen.
 */
export function RootNavigator() {
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

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Main"
    >
      {/* Main is required as the safe reset target for SafetyHelp fallback. */}
      <Stack.Screen name="Main">
        {() => <RootMainContent deepLink={deepLink} />}
      </Stack.Screen>
      <Stack.Screen
        name="SafetyHelp"
        component={SafetyHelpScreen}
        options={{ title: 'Get help', headerShown: true }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
