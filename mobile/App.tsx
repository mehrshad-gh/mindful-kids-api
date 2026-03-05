import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { ParentOnboardingSuccessProvider } from './src/context/ParentOnboardingSuccessContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <AuthProvider>
      <ParentOnboardingSuccessProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </ParentOnboardingSuccessProvider>
    </AuthProvider>
  );
}
