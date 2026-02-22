import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types/navigation';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return err.response.data.error;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

export function LoginScreen({ navigation }: Props) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Sign in failed', getErrorMessage(err));
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
        <Button title="Sign In" onPress={handleLogin} loading={isLoading} style={styles.button} />
        <Button
          title="Create account"
          onPress={() => navigation.navigate('Register')}
          variant="ghost"
        />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  button: { marginTop: spacing.lg },
});
