import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TherapistDashboardScreen } from '../screens/therapist/TherapistDashboardScreen';
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
    </Stack.Navigator>
  );
}
