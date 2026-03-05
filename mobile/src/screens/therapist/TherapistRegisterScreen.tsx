import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Animated, Easing, TextInput, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { recordStandardAcceptances } from '../../utils/legalAcceptance';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { layout } from '../../theme';
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

// ----------------------------------------------------------------------
// Shared UI Components (matching AuthLandingScreen)
// ----------------------------------------------------------------------

const AmbientBackground = React.memo(() => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [anim]);

  const rotate1 = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = anim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F0F4FA' }]} />
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { transform: [{ rotate: rotate1 }, { translateX: 60 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { transform: [{ rotate: rotate2 }, { translateX: -80 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          { transform: [{ rotate: rotate1 }, { translateY: 90 }] },
        ]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />
    </View>
  );
});

function FloatingInput({ label, isPassword, value, onChangeText, autoCapitalize, keyboardType }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused || value !== '' ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, focusAnim]);

  const labelTop = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 8],
  });
  const labelFontSize = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });
  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textMuted, colors.primary],
  });
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.06)', colors.primary],
  });

  return (
    <Animated.View style={[styles.floatingInputWrap, { borderColor }]}>
      <Animated.Text style={[styles.floatingLabel, { top: labelTop, fontSize: labelFontSize, color: labelColor }]}>
        {label}
      </Animated.Text>
      <TextInput
        style={styles.floatingTextInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={isPassword && !showPass}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
      {isPassword && (
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.eyeText}>{showPass ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

function GlowingCTA({ title, onPress, loading }: { title: string; onPress: () => void; loading?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={loading}
    >
      <Animated.View style={[styles.ctaContainer, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[colors.primary, '#4A7BD9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{title}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function TherapistRegisterScreen({ navigation, route }: { navigation: Nav; route: { params?: { fromAuth?: boolean } } }) {
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const cardOp = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOp, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, tension: 30, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [cardOp, cardSlide]);

  const goToSignIn = () => {
    const parent = navigation.getParent() as { navigate: (name: string, params?: object) => void } | undefined;
    if (parent) parent.navigate('Onboarding', { screen: 'Login' });
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Required', 'Please fill name, email, and passwords.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password', 'Password must be at least 8 characters.');
      return;
    }
    if (!termsAccepted) {
      Alert.alert('Error', 'You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    try {
      await register(email.trim(), password, name.trim(), 'therapist');
      await recordStandardAcceptances(['terms', 'privacy_policy', 'professional_disclaimer', 'provider_terms']);
    } catch (err) {
      Alert.alert('Registration failed', getErrorMessage(err));
    }
  };

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollableScreen
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + layout.sectionGap },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[{ opacity: cardOp, transform: [{ translateY: cardSlide }] }]}>
          <TouchableOpacity onPress={goToSignIn} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <View style={styles.backBtnInner}>
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Sign In</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>👤</Text>
            </View>
            <Text style={styles.headerTitle}>Therapist Sign Up</Text>
            <Text style={styles.headerSubtitle}>Create your professional profile.</Text>
          </View>

          <View style={styles.glassCard}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              
              <View style={styles.formContainer}>
                <FloatingInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <FloatingInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <FloatingInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                />
                <FloatingInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                />
              </View>

              <View style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7} style={styles.checkboxTouchTarget}>
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.legalCopyWrap}>
                  <Text style={styles.legalCopy}>I agree to the </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.legalLink}>Terms of Service</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalCopy}>, </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.legalLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalCopy}>, </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ProfessionalDisclaimer')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.legalLink}>Professional Disclaimer</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalCopy}>, and </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ProviderTerms')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.legalLink}>Provider Terms</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalCopy}>.</Text>
                </View>
              </View>

              <GlowingCTA title="Create Account" onPress={handleRegister} loading={isLoading} />
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </ScrollableScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: layout.screenPadding },
  
  // --- Background Blobs ---
  blob: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    opacity: 0.4,
  },
  blob1: { backgroundColor: colors.primary, top: -100, right: -100 },
  blob2: { backgroundColor: '#4A7BD9', bottom: 100, left: -150 },
  blob3: { backgroundColor: '#74A3FF', top: 300, right: -200 },

  // --- Header ---
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  backBtnInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,1)', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  backIcon: { fontSize: 16, color: colors.primary, marginRight: 6, fontWeight: '600' },
  backText: { ...typography.Body, color: colors.primary, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 1)' },
  logoEmoji: { fontSize: 32 },
  headerTitle: { ...typography.HeroTitle, fontSize: 32, letterSpacing: -0.5, color: colors.textPrimary, marginBottom: 8 },
  headerSubtitle: { ...typography.Body, fontSize: 16, color: colors.textSecondary, textAlign: 'center' },

  // --- Card & Form ---
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)', shadowColor: colors.primary, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.08, shadowRadius: 40, elevation: 10, marginBottom: 32 },
  formContainer: { marginBottom: 8 },
  floatingInputWrap: { height: 64, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, marginBottom: 16, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  floatingLabel: { position: 'absolute', left: 16, fontWeight: '500' },
  floatingTextInput: { ...typography.Body, color: colors.textPrimary, marginTop: 16, height: 40 },
  eyeIcon: { position: 'absolute', right: 16, top: 22 },
  eyeText: { ...typography.Caption, fontWeight: '600', color: colors.primary },

  // --- CTA & Legal ---
  ctaContainer: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, borderRadius: 16, marginTop: 8 },
  ctaGradient: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...typography.Body, color: '#fff', fontWeight: '700', fontSize: 18, letterSpacing: 0.5 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 24, paddingHorizontal: 4 },
  checkboxTouchTarget: { marginRight: 10 },
  legalCopyWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  legalCopy: { ...typography.Caption, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  legalLink: { color: colors.primary, fontWeight: '600' },
});
