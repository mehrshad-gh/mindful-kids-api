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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type Props = { navigation: Nav; route: { params?: { onSuccessNavigateTo?: 'AddChild' } } };

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string; details?: Array<{ message?: string }> };
    if (d.error) return d.error;
    if (Array.isArray(d.details) && d.details[0]?.message) return d.details[0].message;
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

export function LoginScreen({ navigation, route }: Props) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const onSuccessNavigateTo = route.params?.onSuccessNavigateTo;

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      await login(email.trim(), password);
      if (onSuccessNavigateTo === 'AddChild') {
        (navigation as any).navigate('DisclaimerConsent', { next: 'AddChild' });
      } else if (onSuccessNavigateTo) {
        (navigation as any).navigate(onSuccessNavigateTo);
      }
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
          onPress={() =>
            navigation.navigate('Register', route.params ? { onSuccessNavigateTo: route.params.onSuccessNavigateTo } : undefined)
          }
          variant="ghost"
        />
        <Button
          title="Register as therapist"
          onPress={() =>
            (navigation.getParent() as any)?.navigate('TherapistOnboarding', {
              screen: 'TherapistRegister',
              params: { fromAuth: true },
            })
          }
          variant="outline"
          style={styles.therapistBtn}
        />
        <Button
          title="Partner with us – Apply as a clinic"
          onPress={() => navigation.navigate('ClinicApplicationForm')}
          variant="ghost"
          style={styles.clinicApplyBtn}
        />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  button: { marginTop: spacing.lg },
  therapistBtn: { marginTop: spacing.sm },
  clinicApplyBtn: { marginTop: spacing.xs },
});
