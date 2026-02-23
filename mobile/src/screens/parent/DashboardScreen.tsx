import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { useProgressSummary } from '../../hooks/useProgressSummary';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ParentTabParamList } from '../../types/navigation';
import type { ParentStackParamList } from '../../types/navigation';

type TabNav = NativeStackNavigationProp<ParentTabParamList, 'Dashboard'>;

const EMOTION_DISPLAY: Record<string, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  sad: { label: 'Sad', emoji: '😢' },
  angry: { label: 'Angry', emoji: '😠' },
  scared: { label: 'Scared', emoji: '😨' },
  calm: { label: 'Calm', emoji: '😌' },
  excited: { label: 'Excited', emoji: '🤩' },
  worried: { label: 'Worried', emoji: '😟' },
  tired: { label: 'Tired', emoji: '😴' },
  loved: { label: 'Loved', emoji: '🥰' },
  surprised: { label: 'Surprised', emoji: '😲' },
};

function getEmotionInsight(emotionId: string): string {
  const insights: Record<string, string> = {
    happy: 'Great to see they’re feeling good. You can build on this with a short chat or play.',
    sad: 'A good moment to offer comfort and listen. Naming the feeling together can help.',
    angry: 'Strong feelings are normal. Suggest a calm-down activity when they’re ready.',
    scared: 'Reassurance and a calm presence help. Ask what would make them feel safer.',
    calm: 'They’re in a regulated state—good time for connection or a low-key activity.',
    excited: 'Harness the energy positively. A quick game or shared activity can channel it.',
    worried: 'Listening without fixing often helps. “I hear you” goes a long way.',
    tired: 'Rest and low stimulation may be what they need most right now.',
    loved: 'Connection is strong. A small moment of attention can reinforce that.',
    surprised: 'Check if it’s a good or overwhelming surprise; respond accordingly.',
  };
  return insights[emotionId] ?? 'Noting how they feel helps you respond with care.';
}

function getProgressSummaryText(summary: {
  completed_count: number;
  total_stars: number;
  current_streak: number;
}): React.ReactNode {
  const { completed_count, total_stars, current_streak } = summary;
  if (completed_count === 0) {
    return <Text style={styles.progressSummary}>No activities completed yet. Completing activities earns stars and builds streaks!</Text>;
  }
  const parts: string[] = [];
  parts.push(`${completed_count} activity${completed_count !== 1 ? 'ies' : ''} completed`);
  parts.push(`${total_stars} total star${total_stars !== 1 ? 's' : ''}`);
  if (current_streak > 0) parts.push(`${current_streak}-day streak`);
  const text = parts.join(', ') + '.';
  return <Text style={styles.progressSummary}>{text.charAt(0).toUpperCase() + text.slice(1)}</Text>;
}

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

export function DashboardScreen() {
  const navigation = useNavigation<TabNav>();
  const { user, setAppRole, selectedChildId, setSelectedChild } = useAuth();
  const { children, loading, error, refresh } = useChildren();
  const { summary, loading: summaryLoading, refresh: refreshSummary } = useProgressSummary(selectedChildId);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshSummary();
    }, [refresh, refreshSummary])
  );

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const parentStack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();

  const handleUseAsChild = () => {
    if (!selectedChildId) {
      Alert.alert('Select a child', 'Choose a child below to use the app as them. Add one if needed.');
      return;
    }
    setAppRole('child');
  };

  const handleAddChild = () => {
    parentStack?.navigate('AddChild');
  };

  const handleRefresh = useCallback(() => {
    refresh();
    refreshSummary();
  }, [refresh, refreshSummary]);

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.parentAccent} />}
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Hello, {user?.name ?? 'Parent'}!</Text>

        {children.length > 0 && selectedChild && (
          <Card style={styles.dashboardCard}>
            <Text style={styles.dashboardChildName}>{selectedChild.name}</Text>
            {summaryLoading && !summary ? (
              <ActivityIndicator size="small" color={colors.parentAccent} style={styles.summaryLoader} />
            ) : summary ? (
              <>
                {getProgressSummaryText(summary)}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>⭐ {summary.total_stars}</Text>
                    <Text style={styles.statLabel}>Total stars</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>🔥 {summary.current_streak}</Text>
                    <Text style={styles.statLabel}>Current streak</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{summary.completed_count}</Text>
                    <Text style={styles.statLabel}>Activities done</Text>
                  </View>
                </View>

                {summary.recent_completions.length > 0 && (
                  <View style={styles.lastRewardSection}>
                    <Text style={styles.lastRewardTitle}>Last activity reward</Text>
                    <View style={styles.lastRewardRow}>
                      <Text style={styles.lastRewardActivity} numberOfLines={1}>
                        {summary.recent_completions[0].activity_title}
                      </Text>
                      <Text style={styles.lastRewardStars}>
                        {'⭐'.repeat(Math.min(5, summary.recent_completions[0].stars))} {summary.recent_completions[0].stars} star{summary.recent_completions[0].stars !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.lastRewardWhen}>{formatCompletedAt(summary.recent_completions[0].completed_at)}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.emotionSection}>
                  <Text style={styles.emotionSectionTitle}>Emotional check-ins</Text>
                  <View style={styles.emotionStatsRow}>
                    <Text style={styles.emotionCount}>
                      {summary.emotion_checkin_count ?? 0} check-in{(summary.emotion_checkin_count ?? 0) !== 1 ? 's' : ''}
                    </Text>
                    {summary.last_emotion ? (
                      <View style={styles.lastEmotionRow}>
                        <Text style={styles.lastEmotionLabel}>Last: </Text>
                        <Text style={styles.lastEmotionValue}>
                          {EMOTION_DISPLAY[summary.last_emotion.emotion]?.emoji ?? '•'}{' '}
                          {EMOTION_DISPLAY[summary.last_emotion.emotion]?.label ?? summary.last_emotion.emotion}
                        </Text>
                        <Text style={styles.lastEmotionWhen}> · {formatCompletedAt(summary.last_emotion.completed_at)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.noEmotionYet}>No emotion check-ins yet.</Text>
                    )}
                  </View>
                  {summary.last_emotion ? (
                    <Text style={styles.insightText}>{getEmotionInsight(summary.last_emotion.emotion)}</Text>
                  ) : null}
                </View>

                {summary.recent_completions.length > 0 && (
                  <View style={styles.recentSection}>
                    <Text style={styles.recentTitle}>Recent activity</Text>
                    {summary.recent_completions.slice(0, 5).map((r) => (
                      <View key={r.id} style={styles.recentRow}>
                        <Text style={styles.recentActivity} numberOfLines={1}>{r.activity_title}</Text>
                        <Text style={styles.recentMeta}>{r.stars} stars · {formatCompletedAt(r.completed_at)}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {summary.recent_completions.length === 0 && (
                  <Text style={styles.noActivity}>No activities completed yet.</Text>
                )}
              </>
            ) : null}
          </Card>
        )}

        <Text style={styles.sectionTitle}>Child for “Child mode”</Text>
        {loading && children.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={colors.parentAccent} />
          </View>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorText}>{error.message}</Text>
            <Button title="Retry" onPress={refresh} variant="outline" style={styles.retryBtn} />
          </Card>
        ) : children.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.hint}>Add a child so they can use the app and you can track progress.</Text>
            <Button title="Add child" onPress={handleAddChild} style={styles.addBtn} />
          </Card>
        ) : (
          <>
            {children.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedChild(c.id)}
                activeOpacity={0.8}
              >
                <Card style={[styles.card, selectedChildId === c.id && styles.cardSelected]}>
                  <Text style={styles.childName}>{c.name}</Text>
                  {c.age_group ? <Text style={styles.childMeta}>{c.age_group}</Text> : null}
                </Card>
              </TouchableOpacity>
            ))}
            <Button title="Add another child" onPress={handleAddChild} variant="ghost" style={styles.addAnother} />
          </>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Quick actions</Text>
          <Text style={styles.cardDesc}>View advice, library, and child progress in the tabs.</Text>
        </Card>

        <Button
          title="Use app as Child"
          onPress={handleUseAsChild}
          variant="outline"
          style={styles.switchBtn}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.lg },
  dashboardCard: { marginBottom: spacing.lg },
  dashboardChildName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  progressSummary: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  summaryLoader: { marginVertical: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stat: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.parentAccent },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  lastRewardSection: { marginBottom: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  lastRewardTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  lastRewardRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  lastRewardActivity: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, minWidth: 0 },
  lastRewardStars: { fontSize: 14, color: colors.childAccent },
  lastRewardWhen: { fontSize: 12, color: colors.textSecondary },
  emotionSection: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  emotionSectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  emotionStatsRow: { marginBottom: spacing.xs },
  emotionCount: { fontSize: 14, fontWeight: '600', color: colors.text },
  lastEmotionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 },
  lastEmotionLabel: { fontSize: 13, color: colors.textSecondary },
  lastEmotionValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  lastEmotionWhen: { fontSize: 12, color: colors.textSecondary },
  noEmotionYet: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  insightText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },
  recentSection: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  recentTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  recentRow: { marginBottom: spacing.sm },
  recentActivity: { fontSize: 14, fontWeight: '600', color: colors.text },
  recentMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  noActivity: { fontSize: 14, color: colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  card: { marginBottom: spacing.md },
  cardSelected: { borderColor: colors.parentAccent, borderWidth: 2 },
  childName: { fontSize: 16, fontWeight: '600', color: colors.text },
  childMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs },
  hint: { color: colors.textSecondary, marginBottom: spacing.sm },
  errorText: { color: colors.error, marginBottom: spacing.sm },
  retryBtn: { alignSelf: 'flex-start' },
  addBtn: { marginTop: spacing.sm },
  addAnother: { marginBottom: spacing.md },
  switchBtn: { marginTop: spacing.md },
  centered: { padding: spacing.md },
});
