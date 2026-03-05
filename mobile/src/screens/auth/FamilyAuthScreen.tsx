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
  TextInputProps,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { recordStandardAcceptances } from '../../utils/legalAcceptance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
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

// ----------------------------------------------------------------------
// Advanced UI Components
// ----------------------------------------------------------------------

const BackgroundBlobs = React.memo(() => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [anim]);

  const spin1 = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = anim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F4F7FB' }]} />
      <Animated.View
        style={[
          styles.blob,
          styles.blobPrimary,
          { transform: [{ rotate: spin1 }, { translateX: 80 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blobSecondary,
          { transform: [{ rotate: spin2 }, { translateX: -100 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blobAccent,
          { transform: [{ rotate: spin1 }, { translateY: 100 }] },
        ]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(244, 247, 251, 0.55)' }]} />
    </View>
  );
});

function PremiumTabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const [width, setWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(tab === 'signin' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: tab === 'signin' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 6,
      speed: 16,
    }).start();
  }, [tab, slideAnim]);

  const indicatorWidth = width > 0 ? (width - 8) / 2 : 0;
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth],
  });

  return (
    <View style={styles.tabsContainer} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View
          style={[styles.tabIndicator, { width: indicatorWidth, transform: [{ translateX }] }]}
        />
      )}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => setTab('signin')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>Sign in</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => setTab('register')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

interface PremiumInputProps extends TextInputProps {
  label: string;
  icon?: string;
  isPassword?: boolean;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
}

function PremiumInput({
  label,
  icon,
  isPassword,
  passwordVisible,
  onTogglePassword,
  ...props
}: PremiumInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.8)', colors.primary],
  });

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)'],
  });

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor, backgroundColor: bgColor }]}>
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          style={styles.textInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="rgba(31, 42, 55, 0.4)"
          secureTextEntry={isPassword && !passwordVisible}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={onTogglePassword}
            style={styles.eyeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.eyeText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

function GradientCTA({ title, onPress, loading }: { title: string; onPress: () => void; loading: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={loading}
    >
      <Animated.View style={[styles.ctaOuter, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#74A3FF', colors.primary, '#4A7BD9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaInner}
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
  const [termsAccepted, setTermsAccepted] = useState(false);

  const titleOp = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleSlide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, [titleOp, titleSlide, cardOp, cardSlide]);

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
    if (!termsAccepted) {
      Alert.alert('Error', 'You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    try {
      await register(email.trim(), password, name.trim());
      await recordStandardAcceptances(['terms', 'privacy_policy']);
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

  return (
    <View style={styles.screen}>
      <BackgroundBlobs />
      
      <ScrollableScreen
        contentContainerStyle={StyleSheet.flatten([
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + layout.sectionGap },
        ])}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[styles.header, { opacity: titleOp, transform: [{ translateY: titleSlide }] }]}
        >
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>✨</Text>
            <Text style={styles.logoText}>MindfulKids</Text>
          </View>
          <Text style={styles.heroGreeting}>
            {tab === 'signin' ? 'Welcome back.' : 'Start your journey.'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardOuter,
            { opacity: cardOp, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <View style={styles.glassCard}>
            <PremiumTabs tab={tab} setTab={setTab} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              {tab === 'signin' ? (
                <>
                  <PremiumInput
                    label="Email Address"
                    icon="✉️"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  <PremiumInput
                    label="Password"
                    icon="🔒"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    isPassword
                    passwordVisible={passwordVisible}
                    onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                  />
                  <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrap}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  <GradientCTA title="Sign In" onPress={handleLogin} loading={isLoading} />
                </>
              ) : (
                <>
                  <PremiumInput
                    label="Full Name"
                    icon="👤"
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                  />
                  <PremiumInput
                    label="Email Address"
                    icon="✉️"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  <PremiumInput
                    label="Password"
                    icon="🔒"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    isPassword
                    passwordVisible={passwordVisible}
                    onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                  />
                  <PremiumInput
                    label="Confirm Password"
                    icon="🔒"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your password"
                    secureTextEntry
                  />

                  <View style={styles.checkboxRow}>
                    <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7} style={styles.checkboxTouchTarget}>
                      <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                        {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.legalCopyWrap}>
                      <Text style={styles.legalCopy}>I agree to the </Text>
                      <TouchableOpacity onPress={openTerms} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                        <Text style={styles.legalLink}>Terms of Service</Text>
                      </TouchableOpacity>
                      <Text style={styles.legalCopy}> and </Text>
                      <TouchableOpacity onPress={openPrivacy} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                        <Text style={styles.legalLink}>Privacy Policy</Text>
                      </TouchableOpacity>
                      <Text style={styles.legalCopy}>.</Text>
                    </View>
                  </View>

                  <GradientCTA title="Create Account" onPress={handleRegister} loading={isLoading} />
                </>
              )}
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </ScrollableScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
  },

  // --- Background Blobs ---
  blob: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    opacity: 0.35,
  },
  blobPrimary: {
    backgroundColor: colors.primary,
    top: -200,
    left: -150,
  },
  blobSecondary: {
    backgroundColor: colors.secondary,
    top: 300,
    right: -200,
  },
  blobAccent: {
    backgroundColor: colors.childAccent || '#9C89FF',
    bottom: -200,
    left: -50,
  },

  // --- Header ---
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  logoText: {
    ...typography.HeroTitle,
    fontSize: 22,
    letterSpacing: -0.2,
    color: colors.textSecondary,
  },
  heroGreeting: {
    ...typography.HeroTitle,
    fontSize: 38,
    textAlign: 'center',
    color: colors.textPrimary,
    lineHeight: 46,
  },

  // --- Card ---
  cardOuter: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 10,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },

  // --- Tabs ---
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 32,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  tabText: {
    ...typography.Body,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  // --- Inputs ---
  inputWrap: {
    marginBottom: 20,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    ...typography.Body,
    color: colors.textPrimary,
    height: '100%',
    minHeight: 56,
  },
  eyeBtn: {
    paddingLeft: 12,
  },
  eyeText: {
    ...typography.Caption,
    color: colors.primary,
    fontWeight: '600',
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    marginTop: -4,
  },
  forgotText: {
    ...typography.Caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // --- CTA ---
  ctaOuter: {
    marginTop: 8,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaInner: {
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  ctaText: {
    ...typography.Body,
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // --- Legal ---
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
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
});
