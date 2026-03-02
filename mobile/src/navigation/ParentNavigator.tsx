import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { AdviceFeedScreen } from '../screens/parent/AdviceFeedScreen';
import { ContentLibraryScreen } from '../screens/parent/ContentLibraryScreen';
import { SearchScreen } from '../screens/parent/SearchScreen';
import { PsychologistDirectoryScreen } from '../screens/parent/PsychologistDirectoryScreen';
import { ClinicDirectoryScreen } from '../screens/parent/ClinicDirectoryScreen';
import { ChildProgressScreen } from '../screens/parent/ChildProgressScreen';
import { AddChildScreen } from '../screens/parent/AddChildScreen';
import { PsychologistDetailScreen } from '../screens/parent/PsychologistDetailScreen';
import { ClinicDetailScreen } from '../screens/parent/ClinicDetailScreen';
import { TrustAndSafetyScreen } from '../screens/parent/TrustAndSafetyScreen';
import type { ParentStackParamList, ParentTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createNativeStackNavigator<ParentStackParamList>();

function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="AdviceFeed" component={AdviceFeedScreen} options={{ tabBarLabel: 'Advice' }} />
      <Tab.Screen name="ContentLibrary" component={ContentLibraryScreen} options={{ tabBarLabel: 'Library' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="PsychologistDirectory" component={PsychologistDirectoryScreen} options={{ tabBarLabel: 'Experts' }} />
      <Tab.Screen name="Clinics" component={ClinicDirectoryScreen} options={{ tabBarLabel: 'Clinics' }} />
      <Tab.Screen name="ChildProgress" component={ChildProgressScreen} options={{ tabBarLabel: 'Progress' }} />
    </Tab.Navigator>
  );
}

export function ParentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Screen name="Main" component={ParentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddChild" component={AddChildScreen} options={{ title: 'Add child' }} />
      <Stack.Screen name="PsychologistDetail" component={PsychologistDetailScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="ClinicDetail" component={ClinicDetailScreen} options={{ title: 'Clinic' }} />
      <Stack.Screen name="TrustAndSafety" component={TrustAndSafetyScreen} options={{ title: 'Trust & safety' }} />
    </Stack.Navigator>
  );
}
