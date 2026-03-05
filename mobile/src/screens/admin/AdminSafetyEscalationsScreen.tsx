import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { getSafetyEscalations, type AdminSafetyEscalationItem } from '../../api/admin';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const PAGE_SIZE = 50;

function EscalationCard({ item }: { item: AdminSafetyEscalationItem }) {
  const whenStr = item.created_at
    ? new Date(item.created_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const whereStr = `${item.route} · ${item.field}`;
  const userLabel = [item.user_name, item.user_email].filter(Boolean).join(' · ') || 'User';

  return (
    <Card style={styles.card}>
      <Text style={styles.userLabel} numberOfLines={1}>
        {userLabel}
      </Text>
      <Text style={styles.when}>When: {whenStr}</Text>
      <Text style={styles.where}>Where: {whereStr}</Text>
      <View style={styles.badges}>
        {(item.matches ?? []).map((m) => (
          <View key={m} style={styles.badge}>
            <Text style={styles.badgeText}>{m}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function AdminSafetyEscalationsScreen() {
  const [escalations, setEscalations] = useState<AdminSafetyEscalationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      const res = await getSafetyEscalations({
        limit: PAGE_SIZE,
        offset,
      });
      setTotal(res.total);
      if (append) {
        setEscalations((prev) => [...prev, ...res.escalations]);
      } else {
        setEscalations(res.escalations);
      }
      offsetRef.current = offset + res.escalations.length;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load safety escalations');
      if (!append) setEscalations([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      offsetRef.current = 0;
      loadPage(0, false);
    }, [loadPage])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    offsetRef.current = 0;
    loadPage(0, false);
  }, [loadPage]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || escalations.length >= total) return;
    loadPage(offsetRef.current, true);
  }, [loadPage, loadingMore, escalations.length, total]);

  if (loading && !escalations.length) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading safety escalations…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false}>
      <FlatList
        data={escalations}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => <EscalationCard item={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.caption}>
              Flagged safety keywords detected. No user text is stored.
            </Text>
            {error ? (
              <Card style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </Card>
            ) : null}
          </>
        }
        ListFooterComponent={
          <>
            {loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}
            {escalations.length > 0 && escalations.length < total ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={onLoadMore}
                disabled={loadingMore}
              >
                <Text style={styles.loadMoreText}>Load more</Text>
              </TouchableOpacity>
            ) : null}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  caption: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  userLabel: { ...typography.subtitle, color: colors.text, marginBottom: spacing.xs },
  when: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  where: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  badge: {
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  badgeText: { ...typography.caption, color: colors.text },
  errorCard: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  loadMoreButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loadMoreText: { ...typography.body, color: colors.primary },
  footerLoader: { paddingVertical: spacing.md, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { ...typography.subtitle, marginTop: spacing.md },
});
