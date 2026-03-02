import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { recordLegalAcceptance } from '../../services/authService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
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
    if (err.response?.status === 502) return 'Server temporarily unavailable. Try again in a moment.';
    if (err.response?.status === 503) return 'Service unavailable. The server may be starting.';
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))
      return 'Request timed out. Check your connection.';
    if (err.code === 'ERR_NETWORK' || !err.response)
      return 'Cannot reach the server. Check your internet and API URL.';
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
      try {
        await recordLegalAcceptance('terms');
        await recordLegalAcceptance('privacy_policy');
      } catch {
        // Non-blocking: acceptance recording failed; user is still registered
      }
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
    <ScreenLayout centered>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Create account</Text>
          <Text style={styles.heroSubtitle}>Join Mindful Kids as a parent</Text>
        </View>

        <Card style={styles.formCard} variant="elevated">
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
            placeholder="At least 8 characters"
            secureTextEntry
          />
          <Text style={styles.agreement}>
            By creating an account you agree to our{' '}
            <Text style={styles.link} onPress={() => (navigation as any).navigate('TermsOfService')}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={() => (navigation as any).navigate('PrivacyPolicy')}>
              Privacy Policy
            </Text>
            .
          </Text>
          <Button
            title="Create account"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.primaryBtn}
          />
        </Card>

        <View style={styles.secondary}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'Login',
                route.params ? { onSuccessNavigateTo: route.params.onSuccessNavigateTo } : undefined
              )
            }
          >
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ClinicApplicationForm')}
            style={styles.clinicLink}
          >
            <Text style={styles.clinicLinkText}>Partner with us – apply as a clinic</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.xl },
  hero: { marginBottom: layout.sectionGap },
  heroTitle: { ...typography.h1, marginBottom: spacing.sm },
  heroSubtitle: { ...typography.body, color: colors.textSecondary },
  formCard: { marginBottom: layout.sectionGap },
  agreement: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  link: { ...typography.bodySmall, color: colors.primary, textDecorationLine: 'underline' },
  primaryBtn: {},
  secondary: { alignItems: 'center' },
  linkText: { ...typography.link },
  clinicLink: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  clinicLinkText: { ...typography.caption, color: colors.textTertiary },
});
