import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { recordStandardAcceptances } from '../../utils/legalAcceptance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'AuthLanding'>;
type Mode = 'login' | 'register';

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

// ----------------------------------------------------------------------
// Advanced UI Components
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
      {/* Frosted overlay to soften the blobs */}
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

function GlowingCTA({ title, onPress, loading }: { title: string; onPress: () => void; loading: boolean }) {
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

// ----------------------------------------------------------------------
// Main Screen
// ----------------------------------------------------------------------

export function AuthLandingScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { login, register, isLoading, onboardingComplete } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Mode switch animation
  const formHeightAnim = useRef(new Animated.Value(0)).current; // 0 = login, 1 = register

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 30, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    Animated.spring(formHeightAnim, {
      toValue: mode === 'register' ? 1 : 0,
      tension: 40,
      friction: 9,
      useNativeDriver: false,
    }).start();
  }, [mode, formHeightAnim]);

  const handleSuccess = () => {
    if (!onboardingComplete) {
      (navigation as any).navigate('DisclaimerConsent', { next: 'AddChild' });
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot password?',
      'Contact support or use your account recovery options to reset your password.'
    );
  };

  const handleAction = async () => {
    Keyboard.dismiss();
    if (mode === 'login') {
      if (!email.trim() || !password) return Alert.alert('Error', 'Please enter email and password');
      try {
        await login(email.trim(), password);
        handleSuccess();
      } catch (err) {
        Alert.alert('Sign in failed', getErrorMessage(err));
      }
    } else {
      if (!name.trim() || !email.trim() || !password || !confirmPassword) return Alert.alert('Error', 'Please fill all fields');
      if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
      if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
      if (!termsAccepted) return Alert.alert('Error', 'You must accept the Terms of Service and Privacy Policy');
      try {
        await register(email.trim(), password, name.trim());
        await recordStandardAcceptances(['terms', 'privacy_policy']);
        handleSuccess();
      } catch (err) {
        Alert.alert('Registration failed', getErrorMessage(err));
      }
    }
  };

  const nameHeight = formHeightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const nameOpacity = formHeightAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, styles.inner]}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoEmoji}>🧠</Text>
              </View>
              <Text style={styles.headerTitle}>MindfulKids</Text>
              <Text style={styles.headerSubtitle}>
                Build calm, confidence, and connection together.
              </Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassCard}>
              
              {/* Custom Segmented Picker */}
              <View style={styles.pickerWrap}>
                <View style={styles.pickerBg} />
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setMode('login')} activeOpacity={1}>
                  <Text style={[styles.pickerText, mode === 'login' && styles.pickerTextActive]}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setMode('register')} activeOpacity={1}>
                  <Text style={[styles.pickerText, mode === 'register' && styles.pickerTextActive]}>Sign Up</Text>
                </TouchableOpacity>
                <Animated.View
                  style={[
                    styles.pickerIndicator,
                    {
                      transform: [
                        {
                          translateX: formHeightAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, (layout.maxContentWidth || 340) / 2 - 28], // approximation
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <Animated.View style={{ height: nameHeight, opacity: nameOpacity, overflow: 'hidden' }}>
                  <FloatingInput
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </Animated.View>

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

                <Animated.View style={{ height: nameHeight, opacity: nameOpacity, overflow: 'hidden' }}>
                  <FloatingInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isPassword
                  />
                </Animated.View>

                {mode === 'login' && (
                  <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn} hitSlop={{ top: 10, bottom: 10 }}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>

              <GlowingCTA
                title={mode === 'login' ? 'Sign In' : 'Create Account'}
                onPress={handleAction}
                loading={isLoading}
              />

              {mode === 'register' && (
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
                    <Text style={styles.legalCopy}> and </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                      <Text style={styles.legalLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalCopy}>.</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Professional Link */}
            <TouchableOpacity
              style={styles.proLinkWrap}
              onPress={() => navigation.navigate('ProfessionalAccess')}
              activeOpacity={0.7}
            >
              <Text style={styles.proLinkText}>
                Are you a professional? <Text style={styles.proLinkBold}>Partner with us</Text>
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },

  // --- Background Blobs ---
  blob: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    opacity: 0.4,
    filter: 'blur(40px)', // web only, but visually approximated on native via opacity
  },
  blob1: {
    backgroundColor: colors.primary,
    top: -100,
    right: -100,
  },
  blob2: {
    backgroundColor: colors.secondary,
    bottom: 100,
    left: -150,
  },
  blob3: {
    backgroundColor: colors.childAccent || '#9C89FF',
    top: 300,
    right: -200,
  },

  // --- Header ---
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  logoEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    ...typography.HeroTitle,
    fontSize: 32,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.Body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },

  // --- Glass Card ---
  glassCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 10,
    marginBottom: 32,
  },

  // --- Segmented Picker ---
  pickerWrap: {
    flexDirection: 'row',
    height: 52,
    marginBottom: 24,
    position: 'relative',
  },
  pickerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
  },
  pickerIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    top: 0,
    left: 0,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  pickerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pickerText: {
    ...typography.Body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pickerTextActive: {
    color: colors.textPrimary,
  },

  // --- Form & Inputs ---
  formContainer: {
    marginBottom: 8,
  },
  floatingInputWrap: {
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
  },
  floatingTextInput: {
    ...typography.Body,
    color: colors.textPrimary,
    marginTop: 16,
    height: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 22,
  },
  eyeText: {
    ...typography.Caption,
    fontWeight: '600',
    color: colors.primary,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    ...typography.Caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // --- CTA ---
  ctaContainer: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 16,
    marginTop: 8,
  },
  ctaGradient: {
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...typography.Body,
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // --- Legal & Checkbox ---
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  checkboxTouchTarget: {
    marginRight: 10,
  },
  legalCopyWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  legalCopy: {
    ...typography.Caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '600',
  },

  // --- Pro Link ---
  proLinkWrap: {
    paddingVertical: 12,
  },
  proLinkText: {
    ...typography.Body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  proLinkBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
