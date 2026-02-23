import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { AppSwitch } from './AppSwitch';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isRestoring, onboardingComplete } = useAuth();

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingNavigator />;
  }

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="App">
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="App" component={AppSwitch} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
