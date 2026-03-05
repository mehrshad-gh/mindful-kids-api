import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { IconCircle } from '../../components/ui/IconCircle';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, layout, borderRadius, shadows } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'ProfessionalAccess'>;

const LEGAL_HIT = { top: 12, bottom: 12, left: 12, right: 12 };

export function ProfessionalAccessScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();

  const openTerms = () => (navigation as any).navigate('TermsOfService');
  const openPrivacy = () => (navigation as any).navigate('PrivacyPolicy');
  const openDisclaimer = () => (navigation as any).navigate('ProfessionalDisclaimer');

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
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primaryMuted, colors.surface, colors.background]}
          style={styles.hero}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('AuthLanding')}
            style={styles.backWrap}
            hitSlop={LEGAL_HIT}
            accessibilityLabel="Back to family"
            accessibilityRole="button"
          >
            <Text style={styles.backLink}>← Back to family</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Professional access</Text>
          <Text style={styles.heroSubtitle}>Therapists and clinics</Text>
        </LinearGradient>

        {/* Premium option cards */}
        <View style={styles.cardsWrap}>
          <Card variant="elevated" style={styles.optionCard}>
            <IconCircle size={52} backgroundColor={colors.primaryMuted} style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>👤</Text>
            </IconCircle>
            <Text style={styles.optionTitle}>I'm a therapist</Text>
            <Text style={styles.optionDesc} numberOfLines={2}>
              Apply and manage your professional profile.
            </Text>
            <View style={styles.ctaRow}>
              <Button
                title="Therapist sign up"
                onPress={goTherapist}
                variant="primary"
                fullWidth
                style={styles.optionBtn}
              />
            </View>
          </Card>
          <Card variant="elevated" style={styles.optionCard}>
            <IconCircle size={52} backgroundColor={colors.primaryMuted} style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>🏢</Text>
            </IconCircle>
            <Text style={styles.optionTitle}>Partner as a clinic</Text>
            <Text style={styles.optionDesc} numberOfLines={2}>
              Apply, get verified, and manage therapists.
            </Text>
            <View style={styles.ctaRow}>
              <Button
                title="Apply as a clinic"
                onPress={goClinic}
                variant="primary"
                fullWidth
                style={styles.optionBtn}
              />
            </View>
          </Card>
        </View>

        {/* Legal footer */}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: layout.sectionGap + 24 },
  hero: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  backWrap: { marginBottom: spacing.md, minHeight: 44, justifyContent: 'center' },
  backLink: { ...typography.caption, color: colors.primary, fontWeight: '500' },
  heroTitle: { ...typography.ScreenTitle, color: colors.text, marginBottom: spacing.xs },
  heroSubtitle: { ...typography.Caption, color: colors.textSecondary },
  cardsWrap: { paddingHorizontal: layout.screenPadding },
  optionCard: {
    marginBottom: spacing.lg,
    padding: layout.cardPadding,
    ...shadows.md,
  },
  optionIcon: { marginBottom: spacing.md },
  optionEmoji: { fontSize: 28 },
  optionTitle: { ...typography.CardTitle, color: colors.text, marginBottom: spacing.xs },
  optionDesc: { ...typography.Caption, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  ctaRow: { marginTop: spacing.xs },
  optionBtn: { minHeight: 48 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: layout.screenPadding,
    gap: 2,
  },
  footerLink: { ...typography.caption, color: colors.primary },
  footerPipe: { ...typography.caption, color: colors.textTertiary },
});
