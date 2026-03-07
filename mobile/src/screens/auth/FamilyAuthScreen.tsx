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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { AuthCard } from '../../components/auth/AuthCard';
import { HeaderBar } from '../../components/layout/HeaderBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { recordLegalAcceptance } from '../../services/authService';
import { LEGAL_DOCUMENT_VERSION } from '../../constants/legalContent';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import type { OnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'FamilyAuth'>;
type Tab = 'signin' | 'register';

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string; details?: Array<{ message?: string }> };
    if (d.error) return d.error;
    if (Array.isArray(d.details) && d.details[0]?.message) return d.details[0].message;
  }
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 502) return 'Server temporarily unavailable. Try again in a moment.';
    if (err.response?.status === 503) return 'Service unavailable.';
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))
      return 'Request timed out. Check your connection.';
    if (err.code === 'ERR_NETWORK' || !err.response)
      return 'Cannot reach the server. Check your internet and API URL.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

const INPUT_HEIGHT = 56;

export function FamilyAuthScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: { params?: { onSuccessNavigateTo?: 'AddChild' } };
}) {
  const insets = useSafeAreaInsets();
  const { login, register, isLoading } = useAuth();
  const onSuccessNavigateTo = route.params?.onSuccessNavigateTo;

  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      await login(email.trim(), password);
      if (onSuccessNavigateTo === 'AddChild') {
        (navigation as any).navigate('DisclaimerConsent', { next: 'AddChild' });
      }
    } catch (err) {
      Alert.alert('Sign in failed', getErrorMessage(err));
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await register(email.trim(), password, name.trim());
      try {
        await recordLegalAcceptance('terms', LEGAL_DOCUMENT_VERSION);
        await recordLegalAcceptance('privacy_policy', LEGAL_DOCUMENT_VERSION);
      } catch {
        // Non-blocking
      }
      if (onSuccessNavigateTo === 'AddChild') {
        (navigation as any).navigate('DisclaimerConsent', { next: 'AddChild' });
      }
    } catch (err) {
      Alert.alert('Registration failed', getErrorMessage(err));
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot password?',
      'Contact support or use your account recovery options to reset your password.'
    );
  };

  const openTerms = () => (navigation as any).navigate('TermsOfService');
  const openPrivacy = () => (navigation as any).navigate('PrivacyPolicy');

  const inputStyle = [styles.input, { minHeight: INPUT_HEIGHT, borderRadius: borderRadius.large }];

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AuthBackground variant="family" heroFraction={0.4}>
        <ScrollableScreen
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
          contentPaddingBottom={layout.sectionGap}
          keyboardShouldPersistTaps="handled"
        >
          <HeaderBar title="Family" subtitle="Sign in or create your account" style={styles.header} />
          <AuthCard style={styles.card}>
            <SegmentedTabs<Tab>
              options={[
                { value: 'signin', label: 'Sign in' },
                { value: 'register', label: 'Create account' },
              ]}
              value={tab}
              onChange={setTab}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.form}
            >
              {tab === 'signin' ? (
                <>
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={inputStyle}
                  />
                  <View style={styles.passwordRow}>
                    <Input
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!passwordVisible}
                      autoComplete="password"
                      style={[inputStyle, styles.passwordInput]}
                    />
                    <TouchableOpacity
                      onPress={() => setPasswordVisible((v) => !v)}
                      style={styles.visibilityBtn}
                      hitSlop={12}
                      accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                      accessibilityRole="button"
                    >
                      <Text style={styles.visibilityText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotWrap}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                  <Button
                    title="Sign in"
                    onPress={handleLogin}
                    loading={isLoading}
                    fullWidth
                    size="large"
                    style={styles.cta}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={colors.textMuted}
                    style={inputStyle}
                  />
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={inputStyle}
                  />
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    style={inputStyle}
                  />
                  <Input
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    style={inputStyle}
                  />
                  <Text style={styles.agreement}>
                    By creating an account you agree to our{' '}
                    <Text style={styles.link} onPress={openTerms}>
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text style={styles.link} onPress={openPrivacy}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                  <Button
                    title="Create account"
                    onPress={handleRegister}
                    loading={isLoading}
                    fullWidth
                    size="large"
                    style={styles.cta}
                  />
                </>
              )}
            </KeyboardAvoidingView>
          </AuthCard>
        </ScrollableScreen>
      </AuthBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingTop: spacing.md },
  header: { marginBottom: spacing.sm },
  card: { marginTop: spacing.sm },
  form: { marginTop: spacing.lg },
  input: { marginBottom: spacing.md },
  passwordRow: { position: 'relative', marginBottom: spacing.md },
  passwordInput: { marginBottom: 0, paddingRight: 56 },
  visibilityBtn: {
    position: 'absolute',
    right: 12,
    top: 36,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  visibilityText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: spacing.lg, minHeight: 44, justifyContent: 'center' },
  forgotText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  cta: { marginTop: spacing.sm, minHeight: 52 },
  agreement: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  link: { ...typography.bodySmall, color: colors.primary, textDecorationLine: 'underline' },
});
