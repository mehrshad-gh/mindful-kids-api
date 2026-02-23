import React, { useState } from 'react';
import { StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type Props = { navigation: Nav; route: { params?: { onSuccessNavigateTo?: 'AddChild' } } };

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string; details?: Array<{ message?: string }> };
    if (d.error) return d.error;
    if (Array.isArray(d.details) && d.details.length)
      return d.details.map((e) => e.message || '').filter(Boolean).join('. ') || d.error || 'Validation failed';
  }
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 502)
      return 'Server is temporarily unavailable (502). Check Railway dashboard or try again in a moment.';
    if (err.response?.status === 503)
      return 'Service unavailable. The server may be starting—try again in a moment.';
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))
      return 'Request timed out. Check your connection.';
    if (err.code === 'ERR_NETWORK' || !err.response)
      return 'Cannot reach the server. Check your internet and that the API URL is correct.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

export function RegisterScreen({ navigation, route }: Props) {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const onSuccessNavigateTo = route.params?.onSuccessNavigateTo;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    try {
      await register(email.trim(), password, name.trim());
      if (onSuccessNavigateTo === 'AddChild') {
        (navigation as any).navigate('DisclaimerConsent', { next: 'AddChild' });
      } else if (onSuccessNavigateTo) {
        (navigation as any).navigate(onSuccessNavigateTo);
      }
    } catch (err) {
      Alert.alert('Registration failed', getErrorMessage(err));
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
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
        <Button title="Create Account" onPress={handleRegister} loading={isLoading} style={styles.button} />
        <Button
          title="Already have an account? Sign In"
          onPress={() =>
            navigation.navigate('Login', route.params ? { onSuccessNavigateTo: route.params.onSuccessNavigateTo } : undefined)
          }
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
