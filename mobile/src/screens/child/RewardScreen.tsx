import React from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useProgressSummary } from '../../hooks/useProgressSummary';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme';

const CONTENT_INSET = 20;
const TAB_PADDING_BOTTOM = 100;

export function RewardScreen() {
  const { selectedChildId } = useAuth();
  const { summary, loading, error, refresh } = useProgressSummary(selectedChildId);

  if (!selectedChildId) {
    return (
      <ScreenLayout edgeToEdge>
        <View style={styles.sectionBlock}>
          <Text style={styles.title}>Rewards</Text>
          <Card style={styles.card}>
            <Text style={styles.placeholder}>Ask a parent to select your profile so your stars and streak show here.</Text>
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
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.childAccent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionBlock}>
          <Text style={styles.title}>Your rewards</Text>

        {error && (
          <Card style={styles.card}>
            <Text style={styles.errorText}>Could not load. Pull to try again.</Text>
          </Card>
        )}

        {!error && summary && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statValue}>{summary.total_stars}</Text>
                <Text style={styles.statLabel}>Total stars</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statValue}>{summary.current_streak}</Text>
                <Text style={styles.statLabel}>Day streak</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent activity</Text>
            {summary.recent_completions.length === 0 ? (
              <Card style={styles.card}>
                <Text style={styles.emptyText}>Complete activities to earn stars and build your streak!</Text>
              </Card>
            ) : (
              summary.recent_completions.map((item) => (
                <Card key={item.id} style={styles.completionCard}>
                  <View style={styles.completionRow}>
                    <Text style={styles.completionStars}>{'⭐'.repeat(Math.min(5, item.stars))}</Text>
                    <View style={styles.completionInfo}>
                      <Text style={styles.completionTitle}>{item.activity_title}</Text>
                      <Text style={styles.completionDate}>
                        {new Date(item.completed_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {!error && !summary && !loading && (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>Your progress will show here. Complete activities to earn stars!</Text>
          </Card>
        )}

          {loading && !summary && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.childAccent} />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 0, paddingBottom: TAB_PADDING_BOTTOM },
  sectionBlock: { paddingHorizontal: CONTENT_INSET, marginBottom: layout.sectionGap },
  title: { fontSize: 24, fontWeight: '700', color: colors.childAccent, marginBottom: spacing.lg },
  placeholder: { color: colors.textSecondary, fontSize: 16 },
  card: { marginBottom: spacing.md },
  errorText: { color: colors.error },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statEmoji: { fontSize: 36, marginBottom: spacing.xs },
  statValue: { fontSize: 32, fontWeight: '800', color: colors.childAccent },
  statLabel: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  completionCard: { marginBottom: spacing.sm },
  completionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  completionStars: { fontSize: 18 },
  completionInfo: { flex: 1 },
  completionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  completionDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  loading: { padding: spacing.xl, alignItems: 'center' },
});
