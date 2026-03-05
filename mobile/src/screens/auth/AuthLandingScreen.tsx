import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { AuthCard } from '../../components/auth/AuthCard';
import { Button } from '../../components/ui/Button';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'AuthLanding'>;

const LEGAL_HIT = { top: 12, bottom: 12, left: 12, right: 12 };

export function AuthLandingScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { onboardingComplete } = useAuth();
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [heroFade, heroSlide, cardFade]);

  const heroContent = (
    <Animated.View
      style={[
        styles.heroInner,
        {
          opacity: heroFade,
          transform: [{ translateY: heroSlide }],
        },
      ]}
    >
      <View style={styles.logoMark}>
        <Text style={styles.logoEmoji}>🧠</Text>
      </View>
      <Text style={styles.title}>MindfulKids</Text>
      <Text style={styles.subtitle}>Daily emotional skill practice for families.</Text>
      <Text style={styles.body}>
        Short daily practice tools that build calm, confidence, and connection — at home, at your pace.
      </Text>
    </Animated.View>
  );

  const openTerms = () => (navigation as any).navigate('TermsOfService');
  const openPrivacy = () => (navigation as any).navigate('PrivacyPolicy');
  const openDisclaimer = () => (navigation as any).navigate('ProfessionalDisclaimer');

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AuthBackground variant="family" heroContent={heroContent}>
        <ScrollableScreen
          contentContainerStyle={styles.scrollContent}
          contentPaddingBottom={layout.sectionGap}
        >
          <Animated.View style={{ opacity: cardFade }}>
            <AuthCard>
              <Text style={styles.ctaLabel}>For parents and families</Text>
              <Button
                title="Continue as Family"
                onPress={() =>
                  navigation.navigate('FamilyAuth', {
                    onSuccessNavigateTo: onboardingComplete ? undefined : 'AddChild',
                  })
                }
                variant="primary"
                size="large"
                fullWidth
                style={styles.primaryBtn}
              />
              <Button
                title="Professional access"
                onPress={() => navigation.navigate('ProfessionalAccess')}
                variant="outline"
                size="large"
                fullWidth
                style={styles.secondaryBtn}
              />
              <Text style={styles.trustCopy}>
                Educational skill-building — not diagnosis or therapy.
              </Text>
            </AuthCard>
          </Animated.View>
          <View style={styles.footer}>
            <TouchableOpacity onPress={openTerms} hitSlop={LEGAL_HIT}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerPipe}> | </Text>
            <TouchableOpacity onPress={openPrivacy} hitSlop={LEGAL_HIT}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerPipe}> | </Text>
            <TouchableOpacity onPress={openDisclaimer} hitSlop={LEGAL_HIT}>
              <Text style={styles.footerLink}>Professional Disclaimer</Text>
            </TouchableOpacity>
          </View>
        </ScrollableScreen>
      </AuthBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  heroInner: { alignItems: 'center', maxWidth: 320 },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 36 },
  title: {
    ...typography.HeroTitle,
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h2,
    fontSize: 20,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  primaryBtn: { marginBottom: spacing.md, minHeight: layout.touchTargetMin },
  secondaryBtn: { marginBottom: spacing.md, minHeight: layout.touchTargetMin },
  trustCopy: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: 2,
  },
  footerLink: { ...typography.caption, color: colors.primary },
  footerPipe: { ...typography.caption, color: colors.textTertiary },
});
