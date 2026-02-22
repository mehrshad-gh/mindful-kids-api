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

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return err.response.data.error;
  }
  if (axios.isAxiosError(err) && err.response?.data?.errors?.length) {
    return err.response.data.errors.map((e: { msg?: string }) => e.msg).join('. ');
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

export function RegisterScreen({ navigation }: Props) {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        <Button title="Already have an account? Sign In" onPress={() => navigation.goBack()} variant="ghost" />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  button: { marginTop: spacing.lg },
});
