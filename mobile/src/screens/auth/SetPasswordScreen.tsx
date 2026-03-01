import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { setPasswordFromInvite } from '../../services/authService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'SetPassword'>;
type Props = { navigation: Nav; route: { params: { token: string } } };

export function SetPasswordScreen({ navigation, route }: Props) {
  const { refreshAuth } = useAuth();
  const token = route.params?.token ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <ScreenLayout centered>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Invalid link</Text>
          <Text style={styles.heroSubtitle}>This set-password link is missing or invalid. Ask your admin for a new one.</Text>
        </View>
      </ScreenLayout>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await setPasswordFromInvite(token, password);
      await refreshAuth();
      // Root will re-render and show App (authenticated)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : err instanceof Error ? err.message : 'Something went wrong.';
      setError(message || 'Failed to set password. Link may have expired.');
      Alert.alert('Error', message || 'Failed to set password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout centered>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Set your password</Text>
        <Text style={styles.heroSubtitle}>
          Your clinic has been approved. Choose a password to sign in and manage your clinic.
        </Text>
      </View>
      <Card style={styles.card} variant="elevated">
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          error={error && !confirm ? error : undefined}
        />
        <Input
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Same as above"
          secureTextEntry
          error={password !== confirm && confirm ? 'Passwords do not match' : undefined}
        />
        <Button
          title="Set password and sign in"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          style={styles.btn}
        />
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: layout.sectionGap },
  heroTitle: { ...typography.h2, marginBottom: spacing.xs },
  heroSubtitle: { ...typography.body, color: colors.textSecondary },
  card: { marginBottom: layout.sectionGap },
  btn: {},
});
