import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminTherapistApplicationsScreen } from '../screens/admin/AdminTherapistApplicationsScreen';
import { AdminApplicationDetailScreen } from '../screens/admin/AdminApplicationDetailScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminReportDetailScreen } from '../screens/admin/AdminReportDetailScreen';
import { AdminClinicsScreen } from '../screens/admin/AdminClinicsScreen';
import { AdminClinicFormScreen } from '../screens/admin/AdminClinicFormScreen';
import { AdminClinicApplicationsScreen } from '../screens/admin/AdminClinicApplicationsScreen';
import { AdminClinicApplicationDetailScreen } from '../screens/admin/AdminClinicApplicationDetailScreen';
import { AdminContentScreen } from '../screens/admin/AdminContentScreen';
import { AdminContentDetailScreen } from '../screens/admin/AdminContentDetailScreen';
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
        component={AdminDashboardScreen}
        options={{ title: 'Admin' }}
      />
      <Stack.Screen
        name="TherapistApplications"
        component={AdminTherapistApplicationsScreen}
        options={{ title: 'Therapist applications' }}
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
      <Stack.Screen
        name="AdminClinics"
        component={AdminClinicsScreen}
        options={{ title: 'Clinics' }}
      />
      <Stack.Screen
        name="AdminClinicForm"
        component={AdminClinicFormScreen}
        options={{ title: 'Add clinic' }}
      />
      <Stack.Screen
        name="AdminClinicApplications"
        component={AdminClinicApplicationsScreen}
        options={{ title: 'Clinic applications' }}
      />
      <Stack.Screen
        name="AdminClinicApplicationDetail"
        component={AdminClinicApplicationDetailScreen}
        options={{ title: 'Clinic application' }}
      />
      <Stack.Screen
        name="AdminContent"
        component={AdminContentScreen}
        options={{ title: 'Content' }}
      />
      <Stack.Screen
        name="AdminContentDetail"
        component={AdminContentDetailScreen}
        options={{ title: 'Content detail' }}
      />
    </Stack.Navigator>
  );
}
