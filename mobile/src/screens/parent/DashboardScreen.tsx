import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { useProgressSummary } from '../../hooks/useProgressSummary';
import { fetchFeaturedAdvice, type AdviceItem } from '../../api/advice';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme';
import { typography } from '../../theme/typography';
import { getParentInsight } from '../../utils/parentInsight';
import type { ParentTabParamList } from '../../types/navigation';
import type { ParentStackParamList } from '../../types/navigation';

const ADVICE_SUMMARY_LENGTH = 120;

function getAdviceSummary(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= ADVICE_SUMMARY_LENGTH) return trimmed;
  return trimmed.slice(0, ADVICE_SUMMARY_LENGTH).trim() + '…';
}

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
  const { user, setAppRole, selectedChildId, setSelectedChild, logout } = useAuth();
  const { children, loading, error, refresh, deleteChild } = useChildren();
  const { summary, loading: summaryLoading, refresh: refreshSummary } = useProgressSummary(selectedChildId);
  const [featuredAdvice, setFeaturedAdvice] = useState<AdviceItem | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(true);

  const loadAdvice = useCallback(async () => {
    setAdviceLoading(true);
    try {
      const item = await fetchFeaturedAdvice();
      setFeaturedAdvice(item);
    } catch {
      setFeaturedAdvice(null);
    } finally {
      setAdviceLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshSummary();
      loadAdvice();
    }, [refresh, refreshSummary, loadAdvice])
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

  const handleRemoveChild = (childId: string, childName: string) => {
    Alert.alert(
      'Remove child profile',
      `Permanently remove ${childName}'s profile and all their progress? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChild(childId);
              const next = children.filter((c) => c.id !== childId)[0]?.id ?? null;
              setSelectedChild(next);
              refresh();
            } catch {
              Alert.alert('Error', 'Could not remove profile. Try again.');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(() => {
    refresh();
    refreshSummary();
    loadAdvice();
  }, [refresh, refreshSummary, loadAdvice]);

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.parentAccent} />}
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Hello, {user?.name ?? 'Parent'}!</Text>

        <Card style={styles.insightCard} variant="elevated">
          <Text style={styles.insightLabel}>Insight for you</Text>
          {children.length === 0 ? (
            <Text style={styles.insightText}>Add a child to see a personalized insight based on their activities and check-ins.</Text>
          ) : !selectedChild ? (
            <Text style={styles.insightText}>Select a child below to see a short, supportive insight.</Text>
          ) : summaryLoading && !summary ? (
            <ActivityIndicator size="small" color={colors.parentAccent} style={styles.insightLoader} />
          ) : (
            <Text style={styles.insightText}>
              {getParentInsight(summary ?? null, selectedChild.name)}
            </Text>
          )}
        </Card>

        <Card style={styles.adviceCard}>
          <Text style={styles.adviceCardLabel}>Daily advice</Text>
          {adviceLoading && !featuredAdvice ? (
            <ActivityIndicator size="small" color={colors.parentAccent} style={styles.adviceLoader} />
          ) : featuredAdvice ? (
            <>
              <Text style={styles.adviceCardTitle}>{featuredAdvice.title}</Text>
              <Text style={styles.adviceCardSummary} numberOfLines={3}>
                {getAdviceSummary(featuredAdvice.content)}
              </Text>
              <Button
                title="Open full advice"
                onPress={() => navigation.navigate('AdviceFeed')}
                variant="outline"
                style={styles.adviceCardButton}
              />
            </>
          ) : (
            <Text style={styles.adviceCardEmpty}>No advice right now. Check back later.</Text>
          )}
        </Card>

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
              <View key={c.id}>
                <TouchableOpacity
                  onPress={() => setSelectedChild(c.id)}
                  activeOpacity={0.8}
                >
                  <Card style={[styles.card, selectedChildId === c.id && styles.cardSelected]}>
                    <Text style={styles.childName}>{c.name}</Text>
                    {c.age_group ? <Text style={styles.childMeta}>{c.age_group}</Text> : null}
                  </Card>
                </TouchableOpacity>
                {selectedChildId === c.id ? (
                  <TouchableOpacity
                    onPress={() => handleRemoveChild(c.id, c.name)}
                    style={styles.removeChildLink}
                  >
                    <Text style={styles.removeChildText}>Remove this child's profile</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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

        <Button title="Sign out" onPress={logout} variant="ghost" style={styles.signOutBtn} />

        <View style={styles.disclaimerFooter}>
          <Text style={styles.disclaimerText}>
            Mindful Kids is not a replacement for professional mental health or medical care. If you or your child need clinical support, please contact a qualified professional.
          </Text>
          <TouchableOpacity
            onPress={() => parentStack?.navigate('TrustAndSafety')}
            style={styles.learnMoreLink}
          >
            <Text style={styles.learnMoreText}>Learn more — Trust & safety</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  insightCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary + '0C',
    borderColor: colors.primary + '24',
  },
  insightLabel: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  insightText: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 22,
  },
  insightLoader: {
    alignSelf: 'flex-start',
    marginVertical: spacing.xs,
  },
  adviceCard: { marginBottom: spacing.lg },
  adviceCardLabel: { ...typography.label, color: colors.parentAccent, marginBottom: spacing.xs },
  adviceCardTitle: { ...typography.h3, marginBottom: spacing.sm },
  adviceCardSummary: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  adviceCardButton: { alignSelf: 'flex-start' },
  adviceCardEmpty: { ...typography.bodySmall, color: colors.textSecondary },
  adviceLoader: { marginVertical: spacing.sm },
  dashboardCard: { marginBottom: spacing.lg },
  dashboardChildName: { ...typography.h2, fontSize: 20, marginBottom: spacing.sm },
  progressSummary: { ...typography.subtitle, marginBottom: spacing.md },
  summaryLoader: { marginVertical: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stat: { flex: 1 },
  statValue: { ...typography.h2, fontSize: 20, color: colors.parentAccent },
  statLabel: { ...typography.caption, marginTop: 2 },
  lastRewardSection: { marginBottom: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  lastRewardTitle: { ...typography.label, marginBottom: spacing.xs },
  lastRewardRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  lastRewardActivity: { ...typography.bodySmall, fontWeight: '600', flex: 1, minWidth: 0 },
  lastRewardStars: { ...typography.subtitle, color: colors.childAccent },
  lastRewardWhen: { ...typography.caption },
  emotionSection: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  emotionSectionTitle: { ...typography.label, marginBottom: spacing.xs },
  emotionStatsRow: { marginBottom: spacing.xs },
  emotionCount: { ...typography.subtitle, fontWeight: '600', color: colors.text },
  lastEmotionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 },
  lastEmotionLabel: { ...typography.caption, fontSize: 13 },
  lastEmotionValue: { ...typography.caption, fontSize: 13, fontWeight: '600', color: colors.text },
  lastEmotionWhen: { ...typography.caption },
  noEmotionYet: { ...typography.caption, fontSize: 13, marginTop: 2 },
  insightText: { ...typography.caption, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  recentSection: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  recentTitle: { ...typography.label, marginBottom: spacing.sm },
  recentRow: { marginBottom: spacing.sm },
  recentActivity: { ...typography.subtitle, fontWeight: '600', color: colors.text },
  recentMeta: { ...typography.caption, marginTop: 2 },
  noActivity: { ...typography.subtitle },
  sectionTitle: { ...typography.h3, fontSize: 16, marginBottom: spacing.sm },
  card: { marginBottom: layout.listItemGap },
  cardSelected: { borderColor: colors.parentAccent, borderWidth: 2 },
  childName: { ...typography.body, fontWeight: '600' },
  childMeta: { ...typography.caption, marginTop: 2 },
  cardTitle: { ...typography.h3 },
  cardDesc: { ...typography.subtitle, marginTop: spacing.xs },
  hint: { ...typography.subtitle, marginBottom: spacing.sm },
  errorText: { ...typography.error, marginBottom: spacing.sm },
  retryBtn: { alignSelf: 'flex-start' },
  addBtn: { marginTop: spacing.sm },
  addAnother: { marginBottom: spacing.md },
  removeChildLink: { marginTop: -spacing.sm, marginBottom: spacing.sm, paddingVertical: spacing.xs },
  removeChildText: { ...typography.caption, color: colors.error },
  switchBtn: { marginTop: spacing.md },
  signOutBtn: { marginTop: spacing.sm },
  disclaimerFooter: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  learnMoreLink: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  learnMoreText: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  centered: { padding: layout.screenPadding },
});
