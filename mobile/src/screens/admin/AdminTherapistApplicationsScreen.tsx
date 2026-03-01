import React, { useState, useCallback, useLayoutEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { listTherapistApplications, type AdminApplicationListItem } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminMain'>;

function getStatusVariant(
  item: AdminApplicationListItem
): 'pending' | 'approved' | 'rejected' | 'suspended' | 'draft' {
  if (item.status === 'draft') return 'draft';
  if (item.status === 'rejected') return 'rejected';
  if (item.status === 'approved') {
    if (
      item.psychologist_verification_status === 'suspended' ||
      item.psychologist_verification_status === 'rejected'
    )
      return 'suspended';
    return 'approved';
  }
  return 'pending';
}

function getStatusLabel(item: AdminApplicationListItem): string {
  if (item.status !== 'approved')
    return item.status === 'pending' ? 'Pending' : item.status === 'rejected' ? 'Rejected' : 'Draft';
  if (item.psychologist_verification_status === 'rejected') return 'Revoked';
  if (item.psychologist_verification_status === 'suspended') return 'Suspended';
  return 'Approved';
}

function ApplicationCard({
  item,
  onPress,
}: {
  item: AdminApplicationListItem;
  onPress: () => void;
}) {
  const isApprovedButSuspended =
    item.status === 'approved' &&
    (item.psychologist_verification_status === 'suspended' ||
      item.psychologist_verification_status === 'rejected');
  const cardStyle: ViewStyle[] = [
    styles.card,
    item.status === 'pending' ? styles.cardPending : undefined,
    isApprovedButSuspended ? styles.cardSuspended : undefined,
  ].filter(Boolean) as ViewStyle[];

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={cardStyle}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.professional_name}</Text>
          <StatusBadge label={getStatusLabel(item)} variant={getStatusVariant(item)} />
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
  const { logout } = useAuth();
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={styles.headerRightBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.headerRightText}>Sign out</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

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
        <Text style={styles.title}>Therapist applications</Text>
        <Text style={styles.subtitle}>
          {filter === 'pending' ? `${pendingCount} pending` : 'All statuses'} · Review and approve or reject
        </Text>
        <View style={styles.navRow}>
          <SegmentedTabs
            options={[{ value: 'pending', label: 'Pending' }, { value: 'all', label: 'All' }]}
            value={filter}
            onChange={(v) => setFilter(v)}
          />
        </View>
        <View style={styles.quickNav}>
          <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('AdminClinicApplications')}>
            <Text style={styles.quickNavText}>Clinic apps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('AdminClinics')}>
            <Text style={styles.quickNavText}>Clinics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('AdminReports')}>
            <Text style={styles.quickNavText}>Reports</Text>
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
            <EmptyState
              title={filter === 'pending' ? 'No pending applications' : 'No applications yet'}
              message="New therapist applications will appear here."
            />
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerRightBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerRightText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  header: { paddingBottom: spacing.md },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  navRow: { marginBottom: spacing.md },
  quickNav: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickNavBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 8,
  },
  quickNavText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  listContainer: { flex: 1 },
  list: { paddingTop: 12 },
  card: { marginBottom: spacing.md },
  cardPending: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardSuspended: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  name: { ...typography.h3, flex: 1, marginRight: spacing.sm },
  email: { ...typography.bodySmall, color: colors.textSecondary },
  specialty: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
