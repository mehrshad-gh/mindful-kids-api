import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClinicDashboardScreen } from '../screens/clinic/ClinicDashboardScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

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
    </Stack.Navigator>
  );
}
