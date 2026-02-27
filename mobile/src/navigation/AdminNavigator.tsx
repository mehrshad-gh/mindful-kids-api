import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminTherapistApplicationsScreen } from '../screens/admin/AdminTherapistApplicationsScreen';
import { AdminApplicationDetailScreen } from '../screens/admin/AdminApplicationDetailScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminReportDetailScreen } from '../screens/admin/AdminReportDetailScreen';
import type { AdminStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
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
        name="AdminMain"
        component={AdminTherapistApplicationsScreen}
        options={{ title: 'Verification' }}
      />
      <Stack.Screen
        name="TherapistApplicationDetail"
        component={AdminApplicationDetailScreen}
        options={{ title: 'Application' }}
      />
      <Stack.Screen
        name="AdminReports"
        component={AdminReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Stack.Screen
        name="AdminReportDetail"
        component={AdminReportDetailScreen}
        options={{ title: 'Report' }}
      />
    </Stack.Navigator>
  );
}
