import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { listAdminClinics, type AdminClinicStatusFilter } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { Clinic } from '../../types/therapist';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminClinics'>;

const STATUS_OPTIONS: { value: AdminClinicStatusFilter; label: string }[] = [
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

function statusBadgeLabel(v?: string | null): string {
  if (v === 'verified') return 'Verified';
  if (v === 'suspended') return 'Suspended';
  if (v === 'rejected') return 'Rejected';
  if (v === 'pending') return 'Pending';
  return v ?? '—';
}

function ClinicCard({ item, onPress }: { item: Clinic; onPress: () => void }) {
  const vs = item.verification_status;
  const badgeColor =
    vs === 'verified' ? colors.success : vs === 'suspended' ? colors.warning : vs === 'rejected' ? colors.error : colors.textMuted;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} resizeMode="cover" />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Text style={styles.logoText}>{item.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.country ? (
              <Text style={styles.meta} numberOfLines={1}>{item.country}</Text>
            ) : null}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: badgeColor + '20', borderColor: badgeColor }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>{statusBadgeLabel(vs)}</Text>
              </View>
              <Text style={styles.therapistCount}>
                {item.therapist_count ?? 0} therapist{(item.therapist_count ?? 0) !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export function AdminClinicsScreen() {
  const navigation = useNavigation<Nav>();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdminClinicStatusFilter>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const { clinics: list } = await listAdminClinics({
        status: statusFilter,
        q: search.trim() || undefined,
        limit: 50,
      });
      setClinics(list);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

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

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Clinics</Text>
        <Text style={styles.subtitle}>
          Manage clinics and clinic admin access. Tap a clinic for details and status.
        </Text>
        <TextInput
          style={styles.search}
          placeholder="Search by name…"
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.chipRow}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, statusFilter === opt.value && styles.chipActive]}
              onPress={() => setStatusFilter(opt.value)}
            >
              <Text style={[styles.chipText, statusFilter === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
            <ClinicCard item={item} onPress={() => navigation.navigate('AdminClinicDetail', { clinicId: item.id })} />
          )}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No clinics"
              message={search.trim() || statusFilter !== 'all' ? 'Try a different filter or search.' : 'Tap "Add clinic" to create one.'}
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
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { ...typography.caption, color: colors.textInverse },
  addBtn: { alignSelf: 'flex-start' },
  listContainer: { flex: 1 },
  list: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, borderRadius: 8, marginRight: spacing.md },
  logoPlaceholder: { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  logoText: { ...typography.h3, color: colors.textSecondary },
  cardBody: { flex: 1, minWidth: 0 },
  name: { ...typography.body, fontWeight: '600', color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  badge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { ...typography.caption, fontWeight: '600', fontSize: 11 },
  therapistCount: { ...typography.caption, color: colors.textTertiary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
