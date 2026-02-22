import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchChildren, type ChildItem } from '../../api/children';
import { fetchProgressSummary, type ProgressSummary } from '../../api/progress';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const authToken: string | null = null; // TODO: from real auth

export function ChildProgressScreen() {
  const { selectedChildId, setSelectedChild } = useAuth();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ProgressSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchChildren(authToken);
      setChildren(list);
      const summaryMap: Record<string, ProgressSummary> = {};
      await Promise.all(
        list.map(async (c) => {
          try {
            const s = await fetchProgressSummary(c.id, authToken);
            summaryMap[c.id] = s;
          } catch (_) {
            // skip this child's summary
          }
        })
      );
      setSummaries(summaryMap);
      if (list.length > 0 && !selectedChildId) {
        setSelectedChild(list[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load');
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, setSelectedChild]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && children.length === 0) {
    return (
      <ScreenLayout>
        <Text style={styles.title}>Child Progress</Text>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.parentAccent} />
        </View>
      </ScreenLayout>
    );
  }

  if (error && children.length === 0) {
    return (
      <ScreenLayout>
        <Text style={styles.title}>Child Progress</Text>
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.hint}>Sign in and try again.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.parentAccent} />
        }
      >
        <Text style={styles.title}>Child Progress</Text>
        <Text style={styles.subtitle}>Stars, streaks, and activity summary</Text>

        {children.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>Add a child in settings to see their progress here.</Text>
          </Card>
        ) : (
          children.map((child) => {
            const summary = summaries[child.id];
            const isSelected = selectedChildId === child.id;
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChild(child.id)}
                activeOpacity={0.8}
              >
                <Card style={[styles.card, isSelected && styles.cardSelected]}>
                  <Text style={styles.childName}>{child.name}</Text>
                  {summary ? (
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>⭐ {summary.total_stars}</Text>
                        <Text style={styles.statLabel}>Total stars</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>🔥 {summary.current_streak}</Text>
                        <Text style={styles.statLabel}>Day streak</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{summary.completed_count}</Text>
                        <Text style={styles.statLabel}>Activities done</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.noData}>No activity yet</Text>
                  )}
                  {summary && summary.recent_completions.length > 0 && (
                    <View style={styles.recent}>
                      <Text style={styles.recentTitle}>Recent</Text>
                      {summary.recent_completions.slice(0, 3).map((r) => (
                        <Text key={r.id} style={styles.recentItem} numberOfLines={1}>
                          {r.activity_title} — {r.stars}⭐
                        </Text>
                      ))}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardSelected: { borderColor: colors.parentAccent, borderWidth: 2 },
  childName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  stat: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  noData: { color: colors.textSecondary, fontSize: 14 },
  recent: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  recentTitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  recentItem: { fontSize: 12, color: colors.text, marginBottom: 2 },
  emptyText: { color: colors.textSecondary },
  errorText: { color: colors.error },
  hint: { color: colors.textSecondary, marginTop: spacing.xs },
  loading: { padding: spacing.xl, alignItems: 'center' },
});
