import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { listMyClinics } from '../../api/clinicAdmin';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';

export function ClinicDashboardScreen() {
  const navigation = useNavigation();
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { clinics } = await listMyClinics();
      if (clinics.length > 0) {
        setClinicName(clinics[0].name);
      } else {
        setClinicName(null);
      }
    } catch {
      setClinicName(null);
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

  if (loading && clinicName === null) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      scroll
      fabSpacing={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Clinic Dashboard</Text>
        {clinicName ? (
          <Card style={styles.card} variant="elevated" accentColor={colors.primary}>
            <Text style={styles.clinicName}>{clinicName}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={styles.statusValue}>Verified</Text>
            </View>
            <Text style={styles.message}>
              Management tools coming soon. You can sign in and view your clinic here.
            </Text>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No clinic linked to your account.</Text>
          </Card>
        )}
        <TouchableOpacity
          onPress={() => (navigation.getParent() as { navigate: (name: string) => void } | undefined)?.navigate('RoleSelect')}
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
  card: { marginBottom: layout.sectionGapSmall },
  clinicName: { ...typography.h3, marginBottom: spacing.md },
  badgeRow: { marginBottom: spacing.md },
  statusLabel: { ...typography.overline, color: colors.textTertiary, marginBottom: spacing.xs },
  statusValue: { ...typography.body, fontWeight: '600', color: colors.success },
  message: { ...typography.body, color: colors.textSecondary },
  emptyText: { ...typography.body, color: colors.textSecondary },
  switchLink: { marginTop: layout.sectionGapSmall, paddingVertical: spacing.sm, alignItems: 'center' },
  switchLinkText: { ...typography.link, fontSize: 14 },
});
