import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TherapistRegisterScreen } from '../screens/therapist/TherapistRegisterScreen';
import { TherapistProfessionalScreen } from '../screens/therapist/TherapistProfessionalScreen';
import { TherapistCredentialsScreen } from '../screens/therapist/TherapistCredentialsScreen';
import { TherapistLicenseScreen } from '../screens/therapist/TherapistLicenseScreen';
import { TherapistSpecialtiesScreen } from '../screens/therapist/TherapistSpecialtiesScreen';
import { TherapistClinicScreen } from '../screens/therapist/TherapistClinicScreen';
import { TherapistSubmitScreen } from '../screens/therapist/TherapistSubmitScreen';
import { TherapistSuccessScreen } from '../screens/therapist/TherapistSuccessScreen';
import type { TherapistOnboardingStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<TherapistOnboardingStackParamList>();

export function TherapistOnboardingNavigator() {
  return (
    <Stack.Navigator
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
    </Stack.Navigator>
  );
}
