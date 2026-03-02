import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { setPasswordFromInvite, recordLegalAcceptance } from '../../services/authService';
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
  const [failureState, setFailureState] = useState<'expired' | 'already_exists' | null>(null);

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

  if (failureState === 'expired') {
    return (
      <ScreenLayout centered>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Link expired</Text>
          <Text style={styles.heroSubtitle}>Your link expired. Contact support.</Text>
        </View>
        <Card style={styles.card} variant="outlined">
          <Text style={styles.failureBody}>Request a new set-password link from your admin or support.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  if (failureState === 'already_exists') {
    return (
      <ScreenLayout centered>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Account already exists</Text>
          <Text style={styles.heroSubtitle}>An account with this email already exists. Sign in with your password.</Text>
        </View>
        <Button
          title="Go to sign in"
          onPress={() => navigation.navigate('Login')}
          fullWidth
          style={styles.btn}
        />
      </ScreenLayout>
    );
  }

  const handleSubmit = async () => {
    setError('');
    setFailureState(null);
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
      try {
        await recordLegalAcceptance('terms');
        await recordLegalAcceptance('privacy_policy');
        await recordLegalAcceptance('professional_disclaimer');
      } catch {
        // Non-blocking
      }
      await refreshAuth();
      // Root will re-render and show App (authenticated)
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : err instanceof Error ? err.message : 'Something went wrong.';
      if (status === 401) {
        setFailureState('expired');
        return;
      }
      if (status === 409) {
        setFailureState('already_exists');
        setError(message || 'An account with this email already exists.');
        return;
      }
      setError(message || 'Failed to set password. Link may have expired.');
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
        <Text style={styles.agreement}>
          By setting your password you agree to our{' '}
          <Text style={styles.link} onPress={() => (navigation as any).navigate('TermsOfService')}>
            Terms of Service
          </Text>
          ,{' '}
          <Text style={styles.link} onPress={() => (navigation as any).navigate('PrivacyPolicy')}>
            Privacy Policy
          </Text>
          , and{' '}
          <Text style={styles.link} onPress={() => (navigation as any).navigate('ProfessionalDisclaimer')}>
            Professional Disclaimer
          </Text>
          .
        </Text>
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
  agreement: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  link: { ...typography.bodySmall, color: colors.primary, textDecorationLine: 'underline' },
  failureBody: { ...typography.body, color: colors.textSecondary },
  btn: {},
});
