import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../design/colors';
import { typography } from '../../design/typography';
import { spacing } from '../../design/spacing';
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

export function LoginScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const onSuccessNavigateTo = route.params?.onSuccessNavigateTo;

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

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

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot password?',
      'Contact support or use your account recovery options to reset your password.'
    );
  };

  const handleCreateAccount = () => {
    navigation.navigate(
      'Register',
      route.params ? { onSuccessNavigateTo: route.params.onSuccessNavigateTo } : undefined
    );
  };

  const handleTherapistRegister = () => {
    (navigation.getParent() as any)?.navigate('TherapistOnboarding', {
      screen: 'TherapistRegister',
      params: { fromAuth: true },
    });
  };

  const handleClinicApply = () => {
    navigation.navigate('ClinicApplicationForm');
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + spacing[24],
              paddingBottom: insets.bottom + spacing[32],
              paddingLeft: insets.left + spacing[24],
              paddingRight: insets.right + spacing[24],
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Visual header: shapes + brand */}
          <View style={styles.visualHeader}>
            <View style={styles.shapeBlob1} />
            <View style={styles.shapeBlob2} />
            <View style={styles.shapeBlob3} />
            <View style={styles.brandBlock}>
              <View style={styles.logoMark}>
                <Text style={styles.logoEmoji}>🌱</Text>
              </View>
              <Text style={styles.brandName}>MindfulKids</Text>
              <Text style={styles.brandTagline}>Emotional skills for families</Text>
            </View>
          </View>

          {/* Form */}
          <Animated.View style={[styles.formBlock, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formHint}>Use your email and password</Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
            />
            <View style={styles.passwordWrap}>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!passwordVisible}
                autoComplete="password"
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible((v) => !v)}
                style={styles.visibilityBtn}
                hitSlop={12}
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
              >
                <Text style={styles.visibilityLabel}>{passwordVisible ? 'Hide' : 'Show'}</Text>
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
              style={styles.primaryBtn}
            />
          </Animated.View>

          {/* Secondary actions */}
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>New to MindfulKids?</Text>
            <TouchableOpacity onPress={handleCreateAccount} hitSlop={12}>
              <Text style={styles.footerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.proSection}>
            <Text style={styles.proSectionLabel}>For professionals</Text>
            <TouchableOpacity
              style={styles.proCard}
              onPress={handleTherapistRegister}
              activeOpacity={0.7}
              accessibilityLabel="I'm a therapist – join as a provider"
              accessibilityRole="button"
            >
              <Text style={styles.proCardTitle}>I'm a therapist</Text>
              <Text style={styles.proCardSubtitle}>Join as a provider and support families</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.proCard, styles.proCardLast]}
              onPress={handleClinicApply}
              activeOpacity={0.7}
              accessibilityLabel="Apply as a clinic"
              accessibilityRole="button"
            >
              <Text style={styles.proCardTitle}>Apply as a clinic</Text>
              <Text style={styles.proCardSubtitle}>Get your organization on MindfulKids</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFBFC' },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {},

  visualHeader: {
    marginBottom: spacing[32],
    minHeight: 200,
    position: 'relative',
  },
  shapeBlob1: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
  shapeBlob2: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.secondary,
    opacity: 0.15,
  },
  shapeBlob3: {
    position: 'absolute',
    bottom: -20,
    left: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    opacity: 0.12,
  },
  brandBlock: {
    alignItems: 'center',
    paddingTop: spacing[24],
    zIndex: 1,
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[16],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 36,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing[4],
  },
  brandTagline: {
    ...typography.Body,
    fontSize: 16,
    color: colors.textSecondary,
  },

  formBlock: {
    paddingVertical: spacing[8],
    marginBottom: spacing[24],
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  formHint: {
    ...typography.Caption,
    marginBottom: spacing[20],
  },
  input: {
    marginBottom: spacing[16],
    minHeight: 52,
    borderRadius: 14,
  },
  passwordWrap: {
    position: 'relative',
    marginBottom: spacing[16],
  },
  passwordInput: { marginBottom: 0, paddingRight: 52 },
  visibilityBtn: {
    position: 'absolute',
    right: 12,
    top: 30,
    height: 52,
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 40,
  },
  visibilityLabel: {
    ...typography.Caption,
    color: colors.primary,
    fontWeight: '600',
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: spacing[20],
  },
  forgotText: {
    ...typography.Caption,
    color: colors.primary,
    fontWeight: '600',
  },
  primaryBtn: {
    minHeight: 52,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[20],
  },
  footerLabel: {
    ...typography.Body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.Body,
    color: colors.primary,
    fontWeight: '700',
  },

  proSection: {
    marginTop: spacing[8],
    marginBottom: spacing[24],
  },
  proSectionLabel: {
    ...typography.Caption,
    color: colors.textMuted,
    marginBottom: spacing[12],
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  proCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[20],
    marginBottom: spacing[12],
    borderWidth: 1,
    borderColor: colors.border,
  },
  proCardLast: {
    marginBottom: 0,
  },
  proCardTitle: {
    ...typography.Body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  proCardSubtitle: {
    ...typography.Caption,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
