import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { listMyClinics, type ClinicAdminClinic } from '../../api/clinicAdmin';
import type { ClinicStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';

type Nav = NativeStackNavigationProp<ClinicStackParamList, 'ClinicDashboard'>;

export function ClinicDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [clinics, setClinics] = useState<ClinicAdminClinic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { clinics: list } = await listMyClinics();
      setClinics(list);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading && clinics.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll fabSpacing={false}>
      <View style={styles.container}>
        <Text style={styles.title}>My clinics</Text>
        {clinics.length > 0 ? (
          clinics.map((clinic) => (
            <TouchableOpacity
              key={clinic.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ClinicDetail', { clinicId: clinic.id })}
            >
              <Card style={styles.card} variant="elevated" accentColor={colors.primary}>
                <Text style={styles.clinicName}>{clinic.name}</Text>
                <Text style={styles.tapHint}>Tap to manage profile and therapists</Text>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Card style={styles.card}>
            <EmptyState
              title="No clinic linked"
              message="No clinic is linked to your account. Contact support if you expect access."
            />
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.legalHeading}>Legal</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ProfessionalDisclaimer')} style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Professional Disclaimer</Text>
          </TouchableOpacity>
        </Card>

        <TouchableOpacity
          onPress={() =>
            (navigation.getParent() as { navigate: (name: string) => void } | undefined)?.navigate(
              'RoleSelect'
            )
          }
          style={styles.switchLink}
        >
          <Text style={styles.switchLinkText}>Switch mode (Parent / Child / Admin)</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h2, marginBottom: layout.sectionGapSmall },
  card: { marginBottom: layout.listItemGap },
  clinicName: { ...typography.h3, marginBottom: spacing.xs },
  tapHint: { ...typography.subtitle, color: colors.textTertiary },
  legalHeading: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  legalLink: { marginTop: spacing.xs },
  legalLinkText: { ...typography.body, color: colors.primary, textDecorationLine: 'underline' },
  switchLink: {
    marginTop: layout.sectionGapSmall,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  switchLinkText: { ...typography.link, fontSize: 14 },
});
