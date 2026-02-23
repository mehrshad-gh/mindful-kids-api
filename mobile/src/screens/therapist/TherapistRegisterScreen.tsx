import React, { useState } from 'react';
import { StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import type { TherapistOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistRegister'>;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  if (axios.isAxiosError(err) && err.response?.status === 409) return 'This email is already registered.';
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

type TherapistRegisterProps = { navigation: Nav; route: { params?: { fromAuth?: boolean } } };

export function TherapistRegisterScreen({ navigation, route }: TherapistRegisterProps) {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fromAuth = route.params?.fromAuth;

  const goToSignIn = () => {
    const parent = navigation.getParent() as any;
    if (fromAuth) parent?.navigate('Auth');
    else parent?.navigate('Onboarding', { screen: 'Login' });
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Required', 'Please fill name, email, and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password', 'Password must be at least 8 characters.');
      return;
    }
    try {
      await register(email.trim(), password, name.trim(), 'therapist');
      navigation.replace('TherapistProfessional');
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
        <Button title="Already have an account? Sign In" onPress={goToSignIn} variant="ghost" style={styles.signIn} />
        <Input label="Full name" value={name} onChangeText={setName} placeholder="Dr. Jane Smith" />
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
          placeholder="At least 8 characters"
          secureTextEntry
        />
        <Button title="Create professional account" onPress={handleRegister} loading={isLoading} style={styles.button} />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  signIn: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  button: { marginTop: spacing.lg },
});
