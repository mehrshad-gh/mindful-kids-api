import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClinicDashboardScreen } from '../screens/clinic/ClinicDashboardScreen';
import { ClinicDetailScreen } from '../screens/clinic/ClinicDetailScreen';
import { ClinicEditScreen } from '../screens/clinic/ClinicEditScreen';
import { ClinicTherapistsScreen } from '../screens/clinic/ClinicTherapistsScreen';
import { ClinicAvailabilityClinicsScreen } from '../screens/clinic/ClinicAvailabilityClinicsScreen';
import { ClinicTherapistAvailabilityScreen } from '../screens/clinic/ClinicTherapistAvailabilityScreen';
import { TermsOfServiceScreen } from '../screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { ProfessionalDisclaimerScreen } from '../screens/legal/ProfessionalDisclaimerScreen';
import { colors } from '../theme/colors';
import type { ClinicStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ClinicStackParamList>();

export function ClinicNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ClinicDashboard"
        component={ClinicDashboardScreen}
        options={{ title: 'Clinic' }}
      />
      <Stack.Screen
        name="ClinicDetail"
        component={ClinicDetailScreen}
        options={{ title: 'Clinic details' }}
      />
      <Stack.Screen
        name="ClinicEdit"
        component={ClinicEditScreen}
        options={{ title: 'Edit profile' }}
      />
      <Stack.Screen
        name="ClinicTherapists"
        component={ClinicTherapistsScreen}
        options={{ title: 'Therapists' }}
      />
      <Stack.Screen
        name="ClinicAvailabilityClinics"
        component={ClinicAvailabilityClinicsScreen}
        options={{ title: 'Manage availability' }}
      />
      <Stack.Screen
        name="ClinicTherapistAvailability"
        component={ClinicTherapistAvailabilityScreen}
        options={({ route }) => ({ title: `${route.params.psychologistName ?? 'Therapist'} – Availability` })}
      />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="ProfessionalDisclaimer" component={ProfessionalDisclaimerScreen} options={{ title: 'Professional Disclaimer' }} />
    </Stack.Navigator>
  );
}
