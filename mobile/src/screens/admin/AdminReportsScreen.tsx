import React, { useState, useCallback, useEffect } from 'react';
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
import { listReports, type AdminReportListItem } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminReports'>;

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const REASON_LABELS: Record<string, string> = {
  misconduct: 'Misconduct',
  inaccurate_info: 'Inaccurate info',
  inappropriate_behavior: 'Inappropriate behavior',
  other: 'Other',
};

function ReportCard({
  item,
  onPress,
}: {
  item: AdminReportListItem;
  onPress: () => void;
}) {
  const statusLabel = STATUS_LABELS[item.status] ?? item.status;
  const reasonLabel = REASON_LABELS[item.reason] ?? item.reason;
  const isOpen = item.status === 'open';
  const cardStyle: ViewStyle = StyleSheet.flatten([
    styles.card,
    isOpen ? styles.cardOpen : undefined,
  ]);

  const dateStr = item.created_at
    ? new Date(item.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={cardStyle}>
        <View style={styles.row}>
          <Text style={styles.reason} numberOfLines={1}>
            {reasonLabel}
          </Text>
          <View style={[styles.badge, isOpen ? styles.badgeOpen : undefined]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.psychologistId} numberOfLines={1}>
          Psychologist: {item.psychologist_id}
        </Text>
        {item.details ? (
          <Text style={styles.details} numberOfLines={2}>
            {item.details}
          </Text>
        ) : null}
        <Text style={styles.date}>{dateStr}</Text>
      </Card>
    </TouchableOpacity>
  );
}

export function AdminReportsScreen() {
  const navigation = useNavigation<Nav>();
  const [reports, setReports] = useState<AdminReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const load = useCallback(async () => {
    try {
      const { reports: list } = await listReports({
        status: filter === 'open' ? 'open' : undefined,
        limit: 50,
      });
      setReports(list);
    } catch {
      setReports([]);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      };
      run();
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  useEffect(() => {
    load();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const openCount = reports.filter((r) => r.status === 'open').length;

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Professional reports</Text>
        <Text style={styles.subtitle}>
          {filter === 'open'
            ? `${openCount} open`
            : `${reports.length} total`} · Trust & safety
        </Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, filter === 'open' && styles.tabActive]}
            onPress={() => setFilter('open')}
          >
            <Text style={[styles.tabText, filter === 'open' && styles.tabTextActive]}>
              Open
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && reports.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReportCard
              item={item}
              onPress={() => navigation.navigate('AdminReportDetail', { reportId: item.id })}
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
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {filter === 'open' ? 'No open reports' : 'No reports yet'}
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
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.text },
  tabTextActive: { ...typography.bodySmall, color: colors.surface },
  listContainer: { flex: 1 },
  list: { padding: spacing.md, paddingTop: 0 },
  card: { marginBottom: spacing.md },
  cardOpen: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  reason: { ...typography.h3, flex: 1 },
  badge: { backgroundColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  badgeOpen: { backgroundColor: colors.warning + '40' },
  badgeText: { fontSize: 12, color: colors.text },
  psychologistId: { ...typography.bodySmall, color: colors.textSecondary },
  details: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  date: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
