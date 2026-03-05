import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'ProfessionalAccess'>;
const LEGAL_HIT = { top: 12, bottom: 12, left: 12, right: 12 };

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

function GlowingCTA({ title, onPress, icon }: { title: string; onPress: () => void; icon?: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.ctaContainer, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[colors.primary, '#4A7BD9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          {icon && <Text style={styles.ctaIcon}>{icon}</Text>}
          <Text style={styles.ctaText}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ----------------------------------------------------------------------
// Main Screen
// ----------------------------------------------------------------------

export function ProfessionalAccessScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Slide = useRef(new Animated.Value(30)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      headerOpacity.setValue(1);
      headerSlide.setValue(0);
      card1Opacity.setValue(1);
      card1Slide.setValue(0);
      card2Opacity.setValue(1);
      card2Slide.setValue(0);
      return;
    }
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card1Opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(card1Slide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card2Opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(card2Slide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, [reduceMotion, headerOpacity, headerSlide, card1Opacity, card1Slide, card2Opacity, card2Slide]);

  const goTherapist = () => {
    (navigation.getParent() as any)?.navigate('TherapistOnboarding', {
      screen: 'TherapistRegister',
      params: { fromAuth: true },
    });
  };

  const goClinic = () => {
    navigation.navigate('ClinicApplicationForm');
  };

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <ScrollableScreen
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + layout.sectionGap },
        ]}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOpacity, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('AuthLanding')}
            style={styles.backBtn}
            hitSlop={LEGAL_HIT}
          >
            <View style={styles.backBtnInner}>
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Back to Families</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🧑‍⚕️</Text>
          </View>
          <Text style={styles.headerTitle}>Partners</Text>
          <Text style={styles.headerSubtitle}>
            Dedicated tools for therapists and clinics.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardOuter,
            { opacity: card1Opacity, transform: [{ translateY: card1Slide }] },
          ]}
        >
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Text style={styles.cardIcon}>👤</Text>
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>I'm a Therapist</Text>
                <Text style={styles.cardDesc}>Apply and manage your professional profile.</Text>
              </View>
            </View>
            <GlowingCTA
              title="Therapist Sign Up"
              onPress={goTherapist}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardOuter,
            { opacity: card2Opacity, transform: [{ translateY: card2Slide }] },
          ]}
        >
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Text style={styles.cardIcon}>🏢</Text>
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>Partner as a Clinic</Text>
                <Text style={styles.cardDesc}>Apply, get verified, and manage therapists.</Text>
              </View>
            </View>
            <GlowingCTA
              title="Apply as a Clinic"
              onPress={goClinic}
            />
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
    width: 500,
    height: 500,
    borderRadius: 250,
    opacity: 0.4,
  },
  blob1: {
    backgroundColor: colors.primary,
    top: -100,
    right: -100,
  },
  blob2: {
    backgroundColor: '#4A7BD9',
    bottom: 100,
    left: -150,
  },
  blob3: {
    backgroundColor: '#74A3FF',
    top: 300,
    right: -200,
  },

  // --- Header ---
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  backIcon: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 6,
    fontWeight: '600',
  },
  backText: {
    ...typography.Body,
    color: colors.primary,
    fontWeight: '600',
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
    maxWidth: 280,
  },

  // --- Cards ---
  cardOuter: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 10,
    marginBottom: 24,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    ...typography.CardTitle,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    ...typography.Caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // --- CTA ---
  ctaContainer: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 16,
  },
  ctaGradient: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  ctaText: {
    ...typography.Body,
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
