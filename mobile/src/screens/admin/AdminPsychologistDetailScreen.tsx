import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { getAdminPsychologist, setPsychologistStatus, type AdminPsychologistDetail } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminPsychologistDetail'>;

export function AdminPsychologistDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const psychologistId = route.params.psychologistId;
  const [psychologist, setPsychologist] = useState<AdminPsychologistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getAdminPsychologist(psychologistId);
      setPsychologist(res.psychologist);
    } catch {
      setPsychologist(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [psychologistId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleStatusChange = (status: 'active' | 'suspended' | 'rejected') => {
    const label = status === 'active' ? 'Active' : status === 'suspended' ? 'Suspended' : 'Rejected';
    Alert.alert(
      'Set therapist status',
      `Set this therapist's status to "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setStatusLoading(true);
            try {
              await setPsychologistStatus(psychologistId, status);
              Alert.alert('Success', 'Therapist status updated.');
              load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not update status');
            } finally {
              setStatusLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !psychologist) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!psychologist) {
    return (
      <ScreenLayout scroll={false}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Could not load therapist.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const vs = psychologist.verification_status;

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.sectionTitle}>Therapist profile</Text>
        <Card style={styles.card}>
          <Text style={styles.name}>{psychologist.name}</Text>
          {psychologist.specialty ? (
            <Text style={styles.caption}>{psychologist.specialty}</Text>
          ) : null}
          <View style={styles.profileRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{vs ?? '—'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Active</Text>
            <Text style={styles.value}>{psychologist.is_active ? 'Yes' : 'No'}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          <TouchableOpacity
            style={[styles.statusChip, vs === 'verified' && styles.statusChipActive]}
            onPress={() => handleStatusChange('active')}
            disabled={statusLoading}
          >
            <Text style={[styles.statusChipText, vs === 'verified' && styles.statusChipTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusChip, vs === 'suspended' && styles.statusChipActive]}
            onPress={() => handleStatusChange('suspended')}
            disabled={statusLoading}
          >
            <Text style={[styles.statusChipText, vs === 'suspended' && styles.statusChipTextActive]}>Suspended</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusChip, vs === 'rejected' && styles.statusChipActive]}
            onPress={() => handleStatusChange('rejected')}
            disabled={statusLoading}
          >
            <Text style={[styles.statusChipText, vs === 'rejected' && styles.statusChipTextActive]}>Rejected</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  errorCard: { margin: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md },
  card: { marginBottom: spacing.md },
  name: { ...typography.h3, marginBottom: spacing.xs },
  caption: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  profileRow: { flexDirection: 'row', marginBottom: spacing.xs },
  label: { ...typography.caption, color: colors.textTertiary, width: 80 },
  value: { ...typography.body, color: colors.text, flex: 1 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { ...typography.body, color: colors.text },
  statusChipTextActive: { ...typography.body, color: colors.textInverse },
});
