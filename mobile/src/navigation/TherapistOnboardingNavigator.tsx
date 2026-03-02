import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TherapistRegisterScreen } from '../screens/therapist/TherapistRegisterScreen';
import { TherapistProfessionalScreen } from '../screens/therapist/TherapistProfessionalScreen';
import { TherapistCredentialsScreen } from '../screens/therapist/TherapistCredentialsScreen';
import { TherapistLicenseScreen } from '../screens/therapist/TherapistLicenseScreen';
import { TherapistSpecialtiesScreen } from '../screens/therapist/TherapistSpecialtiesScreen';
import { TherapistClinicScreen } from '../screens/therapist/TherapistClinicScreen';
import { TherapistSubmitScreen } from '../screens/therapist/TherapistSubmitScreen';
import { TherapistSuccessScreen } from '../screens/therapist/TherapistSuccessScreen';
import { TermsOfServiceScreen } from '../screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { ProfessionalDisclaimerScreen } from '../screens/legal/ProfessionalDisclaimerScreen';
import type { TherapistOnboardingStackParamList } from '../types/navigation';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<TherapistOnboardingStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'TherapistOnboarding'>;

export function TherapistOnboardingNavigator({ route }: Props) {
  const initialScreen = route.params?.initialScreen ?? 'TherapistRegister';
  return (
    <Stack.Navigator
      initialRouteName={initialScreen}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="TherapistRegister" component={TherapistRegisterScreen} options={{ title: 'Create account' }} />
      <Stack.Screen name="TherapistProfessional" component={TherapistProfessionalScreen} options={{ title: 'Professional details' }} />
      <Stack.Screen name="TherapistCredentials" component={TherapistCredentialsScreen} options={{ title: 'Credentials' }} />
      <Stack.Screen name="TherapistLicense" component={TherapistLicenseScreen} options={{ title: 'License document' }} />
      <Stack.Screen name="TherapistSpecialties" component={TherapistSpecialtiesScreen} options={{ title: 'Specialties' }} />
      <Stack.Screen name="TherapistClinic" component={TherapistClinicScreen} options={{ title: 'Clinic affiliation' }} />
      <Stack.Screen name="TherapistSubmit" component={TherapistSubmitScreen} options={{ title: 'Review & submit' }} />
      <Stack.Screen name="TherapistSuccess" component={TherapistSuccessScreen} options={{ title: 'Thank you', headerBackVisible: false }} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="ProfessionalDisclaimer" component={ProfessionalDisclaimerScreen} options={{ title: 'Professional Disclaimer' }} />
    </Stack.Navigator>
  );
}
