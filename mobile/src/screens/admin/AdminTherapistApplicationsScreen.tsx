import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  type ViewStyle,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { listTherapistApplications, type AdminApplicationListItem } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminMain'>;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function ApplicationCard({
  item,
  onPress,
}: {
  item: AdminApplicationListItem;
  onPress: () => void;
}) {
  const statusLabel = STATUS_LABELS[item.status] ?? item.status;
  const isPending = item.status === 'pending';
  const isApprovedButSuspended =
    item.status === 'approved' &&
    (item.psychologist_verification_status === 'suspended' ||
      item.psychologist_verification_status === 'rejected');
  const badgeLabel = isApprovedButSuspended
    ? `${statusLabel} · ${item.psychologist_verification_status === 'rejected' ? 'Revoked' : 'Suspended'}`
    : statusLabel;
  const cardStyle: ViewStyle = StyleSheet.flatten([
    styles.card,
    isPending ? styles.cardPending : undefined,
    isApprovedButSuspended ? styles.cardSuspended : undefined,
  ]);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={cardStyle}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.professional_name}</Text>
          <View
            style={[
              styles.badge,
              item.status === 'pending' && styles.badgePending,
              isApprovedButSuspended && styles.badgeSuspended,
            ]}
          >
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        </View>
        {(item.user_email || item.email) && (
          <Text style={styles.email} numberOfLines={1}>{item.user_email ?? item.email}</Text>
        )}
        {item.specialty ? (
          <Text style={styles.specialty} numberOfLines={1}>{item.specialty}</Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

export function AdminTherapistApplicationsScreen() {
  const navigation = useNavigation<Nav>();
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const load = useCallback(async () => {
    try {
      const { applications: list } = await listTherapistApplications({
        status: filter === 'pending' ? 'pending' : undefined,
        limit: 50,
      });
      setApplications(list);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Therapist applications</Text>
          <TouchableOpacity
            style={styles.reportsBtn}
            onPress={() => navigation.navigate('AdminReports')}
          >
            <Text style={styles.reportsBtnText}>Reports</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {filter === 'pending' ? `${pendingCount} pending` : 'All statuses'} · Review and approve or reject
        </Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, filter === 'pending' && styles.tabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.tabText, filter === 'pending' && styles.tabTextActive]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && applications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ApplicationCard
              item={item}
              onPress={() => navigation.navigate('TherapistApplicationDetail', { applicationId: item.id })}
            />
          )}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {filter === 'pending' ? 'No pending applications' : 'No applications yet'}
              </Text>
            </View>
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  title: { ...typography.h2 },
  reportsBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  reportsBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.text },
  tabTextActive: { ...typography.bodySmall, color: colors.surface },
  listContainer: { flex: 1 },
  list: { padding: spacing.md, paddingTop: 0 },
  card: { marginBottom: spacing.md },
  cardPending: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardSuspended: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  name: { ...typography.h3, flex: 1 },
  badge: { backgroundColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  badgePending: { backgroundColor: colors.primary + '30' },
  badgeSuspended: { backgroundColor: colors.warning + '40' },
  badgeText: { fontSize: 12, color: colors.text },
  email: { ...typography.bodySmall, color: colors.textSecondary },
  specialty: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
