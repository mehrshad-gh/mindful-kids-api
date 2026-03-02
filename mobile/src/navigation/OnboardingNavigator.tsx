import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ClinicApplicationFormScreen } from '../screens/auth/ClinicApplicationFormScreen';
import { SetPasswordScreen } from '../screens/auth/SetPasswordScreen';
import { DisclaimerConsentScreen } from '../screens/onboarding/DisclaimerConsentScreen';
import { OnboardingAddChildScreen } from '../screens/onboarding/OnboardingAddChildScreen';
import { ParentChildExplainScreen } from '../screens/onboarding/ParentChildExplainScreen';
import { TermsOfServiceScreen } from '../screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { ProfessionalDisclaimerScreen } from '../screens/legal/ProfessionalDisclaimerScreen';
import type { OnboardingStackParamList } from '../types/navigation';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingNavigator({ route }: Props) {
  const initialRoute = route.params?.initialRouteName ?? 'Welcome';
  const setPasswordToken = route.params?.token ?? '';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ title: 'Welcome', headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create account' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Sign in' }}
      />
      <Stack.Screen
        name="ClinicApplicationForm"
        component={ClinicApplicationFormScreen}
        options={{ title: 'Apply as a clinic' }}
      />
      <Stack.Screen
        name="SetPassword"
        component={SetPasswordScreen}
        initialParams={{ token: setPasswordToken }}
        options={{ title: 'Set your password' }}
      />
      <Stack.Screen
        name="DisclaimerConsent"
        component={DisclaimerConsentScreen}
        options={{ title: 'Important information' }}
      />
      <Stack.Screen
        name="AddChild"
        component={OnboardingAddChildScreen}
        options={{ title: 'Add your child' }}
      />
      <Stack.Screen
        name="ParentChildExplain"
        component={ParentChildExplainScreen}
        options={{ title: 'You\'re all set' }}
      />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="ProfessionalDisclaimer" component={ProfessionalDisclaimerScreen} options={{ title: 'Professional Disclaimer' }} />
    </Stack.Navigator>
  );
}
