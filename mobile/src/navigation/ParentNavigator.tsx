import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { AdviceFeedScreen } from '../screens/parent/AdviceFeedScreen';
import { ContentLibraryScreen } from '../screens/parent/ContentLibraryScreen';
import { PsychologistDirectoryScreen } from '../screens/parent/PsychologistDirectoryScreen';
import { ChildProgressScreen } from '../screens/parent/ChildProgressScreen';
import { AddChildScreen } from '../screens/parent/AddChildScreen';
import type { ParentStackParamList, ParentTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createNativeStackNavigator<ParentStackParamList>();

function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.parentAccent,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="AdviceFeed" component={AdviceFeedScreen} options={{ tabBarLabel: 'Advice' }} />
      <Tab.Screen name="ContentLibrary" component={ContentLibraryScreen} options={{ tabBarLabel: 'Library' }} />
      <Tab.Screen name="PsychologistDirectory" component={PsychologistDirectoryScreen} options={{ tabBarLabel: 'Experts' }} />
      <Tab.Screen name="ChildProgress" component={ChildProgressScreen} options={{ tabBarLabel: 'Progress' }} />
    </Tab.Navigator>
  );
}

export function ParentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Screen name="Main" component={ParentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddChild" component={AddChildScreen} options={{ title: 'Add child' }} />
    </Stack.Navigator>
  );
}
