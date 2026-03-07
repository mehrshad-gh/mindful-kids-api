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
import { HeroHeader } from '../../components/ui/HeroHeader';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme';

const CONTENT_INSET = 20;
const TAB_PADDING_BOTTOM = 100;

function formatCompletedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today) {
    return `Today, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

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
      const list = await fetchChildren();
      setChildren(list);
      const summaryMap: Record<string, ProgressSummary> = {};
      await Promise.all(
        list.map(async (c) => {
          try {
            const s = await fetchProgressSummary(c.id);
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
      <ScreenLayout edgeToEdge>
        <View style={styles.sectionBlock}>
          <HeroHeader title="Progress" subtitle="Loading…" overline="Child" />
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.parentAccent} />
          </View>
        </View>
      </ScreenLayout>
    );
  }

  if (error && children.length === 0) {
    return (
      <ScreenLayout edgeToEdge>
        <View style={styles.sectionBlock}>
          <HeroHeader title="Progress" subtitle="Something went wrong." overline="Child" />
          <Card variant="glass" style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.hint}>Sign in and try again.</Text>
          </Card>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false} edgeToEdge>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.parentAccent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionBlock}>
          <HeroHeader
            title="Progress"
            subtitle="Stars, streaks, and activity summary. Tap a child to set them for Child mode."
            overline="Child"
          />
        </View>
        <View style={styles.sectionBlock}>
          {children.length === 0 ? (
            <Card variant="glass" style={styles.card}>
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
                  <Card variant="glass" style={[styles.card, isSelected && styles.cardSelected]}>
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
                      {summary.recent_completions.slice(0, 5).map((r) => (
                        <View key={r.id} style={styles.recentItemRow}>
                          <Text style={styles.recentItem} numberOfLines={1}>
                            {r.activity_title} — {r.stars}⭐
                          </Text>
                          <Text style={styles.recentItemTime}>{formatCompletedAt(r.completed_at)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 0, paddingBottom: TAB_PADDING_BOTTOM },
  sectionBlock: { paddingHorizontal: CONTENT_INSET, marginBottom: layout.sectionGap },
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
  recentItemRow: { marginBottom: 4 },
  recentItem: { fontSize: 12, color: colors.text },
  recentItemTime: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  emptyText: { color: colors.textSecondary },
  errorText: { color: colors.error },
  hint: { color: colors.textSecondary, marginTop: spacing.xs },
  loading: { padding: spacing.xl, alignItems: 'center' },
});
