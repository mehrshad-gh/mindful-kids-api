import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TherapistDashboardScreen } from '../screens/therapist/TherapistDashboardScreen';
import { TherapistAvailabilityScreen } from '../screens/therapist/TherapistAvailabilityScreen';
import { TherapistAppointmentRequestsScreen } from '../screens/therapist/TherapistAppointmentRequestsScreen';
import { TermsOfServiceScreen } from '../screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { ProfessionalDisclaimerScreen } from '../screens/legal/ProfessionalDisclaimerScreen';
import { ProviderTermsScreen } from '../screens/legal/ProviderTermsScreen';
import type { TherapistStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<TherapistStackParamList>();

export function TherapistNavigator() {
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
        name="TherapistDashboard"
        component={TherapistDashboardScreen}
        options={{ title: 'Therapist' }}
      />
      <Stack.Screen
        name="TherapistAvailability"
        component={TherapistAvailabilityScreen}
        options={{ title: 'Availability' }}
      />
      <Stack.Screen
        name="TherapistAppointmentRequests"
        component={TherapistAppointmentRequestsScreen}
        options={{ title: 'Appointment requests' }}
      />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="ProfessionalDisclaimer" component={ProfessionalDisclaimerScreen} options={{ title: 'Professional Disclaimer' }} />
      <Stack.Screen name="ProviderTerms" component={ProviderTermsScreen} options={{ title: 'Provider Terms' }} />
    </Stack.Navigator>
  );
}
