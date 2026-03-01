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
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { listClinicApplications } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { ClinicApplication } from '../../types/therapist';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminClinicApplications'>;

function ApplicationCard({
  item,
  onPress,
}: {
  item: ClinicApplication;
  onPress: () => void;
}) {
  const statusLabel = item.status === 'pending' ? 'Pending' : item.status === 'approved' ? 'Approved' : 'Rejected';
  const variant = item.status === 'pending' ? 'pending' : item.status === 'approved' ? 'approved' : 'rejected';

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card
        style={[
          styles.card,
          item.status === 'pending' && styles.cardPending,
        ] as ViewStyle}
      >
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {item.clinic_name}
          </Text>
          <StatusBadge label={statusLabel} variant={variant} />
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {item.contact_email}
        </Text>
        {item.country ? (
          <Text style={styles.meta} numberOfLines={1}>
            {item.country}
            {item.submitted_at
              ? ` · ${new Date(item.submitted_at).toLocaleDateString()}`
              : ''}
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

export function AdminClinicApplicationsScreen() {
  const navigation = useNavigation<Nav>();
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const load = useCallback(async () => {
    try {
      const { applications: list } = await listClinicApplications({
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
        <Text style={styles.title}>Clinic applications</Text>
        <Text style={styles.subtitle}>
          {filter === 'pending' ? `${pendingCount} pending` : 'All statuses'} · Approve or reject
        </Text>
        <View style={styles.navRow}>
          <SegmentedTabs
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'all', label: 'All' },
            ]}
            value={filter}
            onChange={(v) => setFilter(v)}
          />
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
              onPress={() =>
                navigation.navigate('AdminClinicApplicationDetail', { applicationId: item.id })
              }
            />
          )}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === 'pending' ? 'No pending clinic applications' : 'No applications yet'}
              message="New clinic applications will appear here."
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
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  navRow: { marginBottom: spacing.md },
  listContainer: { flex: 1 },
  list: { paddingTop: layout.sectionGapSmall },
  card: { marginBottom: spacing.md },
  cardPending: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  name: { ...typography.h3, flex: 1, marginRight: spacing.sm },
  email: { ...typography.bodySmall, color: colors.textSecondary },
  meta: { ...typography.bodySmall, color: colors.textTertiary, marginTop: spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
