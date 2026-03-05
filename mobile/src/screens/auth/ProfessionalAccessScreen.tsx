import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { HeaderBar } from '../../components/layout/HeaderBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
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
      <AuthBackground variant="professional">
        <ScrollableScreen
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
          contentPaddingBottom={layout.sectionGap}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('AuthLanding')}
            style={styles.backWrap}
            hitSlop={LEGAL_HIT}
            accessibilityLabel="Back to family"
            accessibilityRole="button"
          >
            <Text style={styles.backLink}>Back to family</Text>
          </TouchableOpacity>
          <HeaderBar
            title="Professional access"
            subtitle="Therapists and clinics"
            style={styles.header}
          />
          <Card variant="elevated" style={styles.optionCard}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="person" size={28} color={colors.primary} />
            </View>
            <Text style={styles.optionTitle}>I'm a therapist</Text>
            <Text style={styles.optionDesc}>Apply and manage your professional profile.</Text>
            <Button
              title="Therapist sign up"
              onPress={goTherapist}
              variant="primary"
              fullWidth
              style={styles.optionBtn}
            />
          </Card>
          <Card variant="elevated" style={styles.optionCard}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="business" size={28} color={colors.primary} />
            </View>
            <Text style={styles.optionTitle}>Partner as a clinic</Text>
            <Text style={styles.optionDesc}>Apply, get verified, and manage therapists.</Text>
            <Button
              title="Apply as a clinic"
              onPress={goClinic}
              variant="primary"
              fullWidth
              style={styles.optionBtn}
            />
          </Card>
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
  scrollContent: { paddingTop: spacing.sm },
  backWrap: { marginBottom: spacing.md, minHeight: 44, justifyContent: 'center' },
  backLink: { ...typography.caption, color: colors.primary },
  header: { marginBottom: spacing.lg },
  optionCard: { marginBottom: spacing.lg },
  optionIconWrap: {
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  optionTitle: {
    ...typography.CardTitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    ...typography.Caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  optionBtn: { minHeight: 48 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: 2,
  },
  footerLink: { ...typography.caption, color: colors.primary },
  footerPipe: { ...typography.caption, color: colors.textTertiary },
});
