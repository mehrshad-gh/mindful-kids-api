import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { listAdminClinics, setClinicStatus } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { Clinic } from '../../types/therapist';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminClinics'>;

function statusLabel(v?: string | null): string {
  if (v === 'verified') return 'Active';
  if (v === 'suspended') return 'Suspended';
  if (v === 'rejected') return 'Rejected';
  return v ?? '—';
}

function ClinicCard({
  item,
  onStatusChange,
  statusLoading,
}: {
  item: Clinic;
  onStatusChange: (clinicId: string, status: 'active' | 'suspended' | 'rejected') => void;
  statusLoading: string | null;
}) {
  const loading = statusLoading === item.id;
  const vs = item.verification_status;
  return (
    <Card style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      {(item.country || item.location) && (
        <Text style={styles.meta} numberOfLines={1}>
          {[item.location, item.country].filter(Boolean).join(' · ')}
        </Text>
      )}
      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <Text style={styles.statusLabel}>Status: {statusLabel(vs)}</Text>
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[styles.statusChip, vs === 'verified' && styles.statusChipActive]}
          onPress={() => onStatusChange(item.id, 'active')}
          disabled={loading}
        >
          <Text style={[styles.statusChipText, vs === 'verified' && styles.statusChipTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, vs === 'suspended' && styles.statusChipActive]}
          onPress={() => onStatusChange(item.id, 'suspended')}
          disabled={loading}
        >
          <Text style={[styles.statusChipText, vs === 'suspended' && styles.statusChipTextActive]}>Suspended</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, vs === 'rejected' && styles.statusChipActive]}
          onPress={() => onStatusChange(item.id, 'rejected')}
          disabled={loading}
        >
          <Text style={[styles.statusChipText, vs === 'rejected' && styles.statusChipTextActive]}>Rejected</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export function AdminClinicsScreen() {
  const navigation = useNavigation<Nav>();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { clinics: list } = await listAdminClinics();
      setClinics(list);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleClinicStatus = (clinicId: string, status: 'active' | 'suspended' | 'rejected') => {
    const label = status === 'active' ? 'Active' : status === 'suspended' ? 'Suspended' : 'Rejected';
    Alert.alert(
      'Set clinic status',
      `Set this clinic's status to "${label}"? This affects its visibility in the directory.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setStatusLoading(clinicId);
            try {
              await setClinicStatus(clinicId, status);
              setClinics((prev) =>
                prev.map((c) =>
                  c.id === clinicId
                    ? { ...c, verification_status: status === 'active' ? 'verified' : status }
                    : c
                )
              );
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not update status');
            } finally {
              setStatusLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Clinics</Text>
        <Text style={styles.subtitle}>
          Add clinics so therapists can choose them when applying. Parents see clinics in the directory.
        </Text>
        <Button
          title="Add clinic"
          onPress={() => navigation.navigate('AdminClinicForm')}
          style={styles.addBtn}
        />
      </View>

      {loading && clinics.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClinicCard
              item={item}
              onStatusChange={handleClinicStatus}
              statusLoading={statusLoading}
            />
          )}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No clinics yet"
              message='Tap "Add clinic" to create one. Therapists can then affiliate with clinics.'
            />
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.md },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  addBtn: { alignSelf: 'flex-start' },
  listContainer: { flex: 1 },
  list: { paddingTop: 12 },
  card: { marginBottom: spacing.md },
  name: { ...typography.h3, marginBottom: spacing.xs },
  meta: { ...typography.bodySmall, color: colors.textSecondary },
  desc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  statusLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap' },
  statusChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { ...typography.bodySmall, color: colors.text },
  statusChipTextActive: { ...typography.bodySmall, color: colors.textInverse },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
