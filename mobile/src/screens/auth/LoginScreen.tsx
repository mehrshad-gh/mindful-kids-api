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
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
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
    <ScreenLayout centered>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSubtitle}>Sign in to your Mindful Kids account</Text>
        </View>

        <Card style={styles.formCard} variant="elevated">
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
          <Button
            title="Sign in"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            style={styles.primaryBtn}
          />
        </Card>

        <View style={styles.secondary}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'Register',
                route.params ? { onSuccessNavigateTo: route.params.onSuccessNavigateTo } : undefined
              )
            }
          >
            <Text style={styles.linkText}>Create an account</Text>
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <Button
            title="I'm a therapist – register"
            onPress={() =>
              (navigation.getParent() as any)?.navigate('TherapistOnboarding', {
                screen: 'TherapistRegister',
                params: { fromAuth: true },
              })
            }
            variant="outline"
            size="small"
            fullWidth
            style={styles.secondaryBtn}
          />
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
  primaryBtn: {},
  secondary: { alignItems: 'center' },
  linkText: { ...typography.link },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    width: '100%',
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textTertiary, marginHorizontal: spacing.md },
  secondaryBtn: { alignSelf: 'stretch' },
  clinicLink: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  clinicLinkText: { ...typography.caption, color: colors.textTertiary },
});
