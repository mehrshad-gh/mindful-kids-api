import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParentOnboardingWelcomeScreen } from '../screens/onboarding/ParentOnboardingWelcomeScreen';
import { ParentOnboardingAddChildScreen } from '../screens/onboarding/ParentOnboardingAddChildScreen';
import { ParentOnboardingFirstPracticeScreen } from '../screens/onboarding/ParentOnboardingFirstPracticeScreen';
import type { ParentOnboardingStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ParentOnboardingStackParamList>();

export function ParentOnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="ParentOnboardingWelcome"
    >
      <Stack.Screen name="ParentOnboardingWelcome" component={ParentOnboardingWelcomeScreen} />
      <Stack.Screen name="ParentOnboardingAddChild" component={ParentOnboardingAddChildScreen} />
      <Stack.Screen name="ParentOnboardingFirstPractice" component={ParentOnboardingFirstPracticeScreen} />
    </Stack.Navigator>
  );
}
