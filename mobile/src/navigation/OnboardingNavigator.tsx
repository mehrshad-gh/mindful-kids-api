import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingAddChildScreen } from '../screens/onboarding/OnboardingAddChildScreen';
import { ParentChildExplainScreen } from '../screens/onboarding/ParentChildExplainScreen';
import type { OnboardingStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ title: 'Welcome', headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create account' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Sign in' }}
      />
      <Stack.Screen
        name="AddChild"
        component={OnboardingAddChildScreen}
        options={{ title: 'Add your child' }}
      />
      <Stack.Screen
        name="ParentChildExplain"
        component={ParentChildExplainScreen}
        options={{ title: 'You\'re all set' }}
      />
    </Stack.Navigator>
  );
}
