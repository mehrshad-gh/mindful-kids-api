import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getClinic } from '../../api/clinicAdmin';
import type { ClinicStackParamList } from '../../types/navigation';
import type { ClinicWithCount } from '../../api/clinicAdmin';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';

type Nav = NativeStackNavigationProp<ClinicStackParamList, 'ClinicDetail'>;
type Route = RouteProp<ClinicStackParamList, 'ClinicDetail'>;

export function ClinicDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { clinicId } = route.params;
  const [clinic, setClinic] = useState<ClinicWithCount | null>(null);
  const [therapistCount, setTherapistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { clinic: c, therapist_count } = await getClinic(clinicId);
      setClinic(c);
      setTherapistCount(therapist_count);
    } catch {
      setClinic(null);
      setTherapistCount(0);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading && !clinic) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!clinic) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Clinic not found.</Text>
          <Button title="Back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScreenLayout>
    );
  }

  const statusLabel =
    clinic.verification_status === 'verified'
      ? 'Verified'
      : clinic.verification_status === 'pending'
        ? 'Pending'
        : clinic.verification_status === 'rejected'
          ? 'Rejected'
          : 'Draft';
  const statusVariant =
    clinic.verification_status === 'verified'
      ? 'approved'
      : clinic.verification_status === 'pending'
        ? 'pending'
        : clinic.verification_status === 'rejected'
          ? 'rejected'
          : 'draft';

  return (
    <ScreenLayout scroll>
      <View style={styles.container}>
        <Card variant="elevated" accentColor={colors.primary} style={styles.card}>
          <Text style={styles.name}>{clinic.name}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge label={statusLabel} variant={statusVariant} />
          </View>
          {clinic.description ? (
            <Text style={styles.description}>{clinic.description}</Text>
          ) : null}
          {(clinic.address || clinic.location) && (
            <Text style={styles.meta}>
              {[clinic.address, clinic.location].filter(Boolean).join(' · ')}
            </Text>
          )}
          {clinic.country ? (
            <Text style={styles.meta}>Country: {clinic.country}</Text>
          ) : null}
          {clinic.website ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(clinic.website!.startsWith('http') ? clinic.website! : `https://${clinic.website!}`)}
              style={styles.linkWrap}
            >
              <Text style={styles.link}>{clinic.website}</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.therapistCount}>
            {therapistCount} therapist{therapistCount !== 1 ? 's' : ''} at this clinic
          </Text>
        </Card>

        <Button
          title="Edit profile"
          variant="outline"
          onPress={() => navigation.navigate('ClinicEdit', { clinicId })}
          style={styles.button}
        />
        <Button
          title="Manage therapists"
          variant="secondary"
          onPress={() => navigation.navigate('ClinicTherapists', { clinicId })}
          style={styles.button}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: layout.sectionGapSmall },
  name: { ...typography.h2, marginBottom: spacing.sm },
  badgeRow: { marginBottom: spacing.md },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  meta: { ...typography.subtitle, color: colors.textTertiary, marginBottom: spacing.xs },
  linkWrap: { marginTop: spacing.xs },
  link: { ...typography.link, fontSize: 14 },
  therapistCount: { ...typography.subtitle, color: colors.textSecondary, marginTop: spacing.md },
  button: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
});
