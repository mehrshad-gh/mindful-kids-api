import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { getClinic } from '../../api/clinics';
import type { Clinic, ClinicTherapist } from '../../types/therapist';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<ParentStackParamList, 'ClinicDetail'>;

function formatRating(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

function TherapistCard({
  therapist,
  onPress,
}: {
  therapist: ClinicTherapist;
  onPress: () => void;
}) {
  const rating = therapist.avg_rating ?? null;
  const reviewCount = therapist.review_count ?? 0;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.therapistCard}>
        <View style={styles.therapistRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{therapist.name.charAt(0)}</Text>
          </View>
          <View style={styles.therapistMeta}>
            <View style={styles.therapistNameRow}>
              <Text style={styles.therapistName} numberOfLines={1}>{therapist.name}</Text>
              {therapist.is_verified ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              ) : null}
            </View>
            {therapist.specialty ? (
              <Text style={styles.therapistSpecialty} numberOfLines={1}>{therapist.specialty}</Text>
            ) : null}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>{formatRating(rating)}</Text>
              <Text style={styles.star}>★</Text>
              {reviewCount > 0 && (
                <Text style={styles.reviewCount}>({reviewCount})</Text>
              )}
            </View>
            {therapist.role_label ? (
              <Text style={styles.roleLabel}>{therapist.role_label}</Text>
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export function ClinicDetailScreen({ route, navigation }: Props) {
  const { clinicId } = route.params;
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [therapists, setTherapists] = useState<ClinicTherapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getClinic(clinicId);
      setClinic(res.clinic);
      setTherapists(res.therapists ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load clinic');
      setClinic(null);
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openTherapist = (psychologistId: string) => {
    navigation.navigate('PsychologistDetail', { psychologistId });
  };

  if (loading && !clinic) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.parentAccent} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !clinic) {
    return (
      <ScreenLayout>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error ?? 'Clinic not found'}</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const locationLine = [clinic.location, clinic.address, clinic.country].filter(Boolean).join(' · ');

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.name}>{clinic.name}</Text>
          {locationLine ? (
            <Text style={styles.location}>📍 {locationLine}</Text>
          ) : null}
        </View>

        {clinic.description ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{clinic.description}</Text>
          </Card>
        ) : null}

        {clinic.website ? (
          <TouchableOpacity
            style={styles.websiteLink}
            onPress={() => Linking.openURL(clinic.website!.startsWith('http') ? clinic.website! : `https://${clinic.website}`)}
          >
            <Text style={styles.websiteText}>Visit website</Text>
          </TouchableOpacity>
        ) : null}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Therapists ({therapists.length})</Text>
          {therapists.length === 0 ? (
            <Text style={styles.emptyTherapists}>No therapists listed yet.</Text>
          ) : (
            therapists.map((t) => (
              <TherapistCard
                key={t.id}
                therapist={t}
                onPress={() => openTherapist(t.id)}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  errorCard: { margin: spacing.md },
  errorText: { color: colors.error },
  header: { marginBottom: spacing.lg },
  name: { ...typography.h2, marginBottom: spacing.xs },
  location: { ...typography.body, color: colors.textSecondary },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  description: { ...typography.bodySmall },
  websiteLink: { marginBottom: spacing.lg },
  websiteText: { ...typography.body, color: colors.parentAccent },
  therapistCard: { marginBottom: spacing.sm },
  therapistRow: { flexDirection: 'row' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.parentAccent + '28',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 20, fontWeight: '600', color: colors.parentAccent },
  therapistMeta: { flex: 1, minWidth: 0 },
  therapistNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  therapistName: { ...typography.body, fontWeight: '600', flex: 1 },
  verifiedBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  therapistSpecialty: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2 },
  ratingText: { ...typography.subtitle, fontWeight: '600', color: colors.text },
  star: { fontSize: 12, color: colors.warning },
  reviewCount: { ...typography.bodySmall, color: colors.textSecondary },
  roleLabel: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  emptyTherapists: { ...typography.bodySmall, color: colors.textSecondary },
});
