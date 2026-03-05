import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, ScrollView, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { useProgressSummary } from '../../hooks/useProgressSummary';
import { fetchFeaturedAdvice, type AdviceItem } from '../../api/advice';
import { fetchDailyTip, recordDailyTipViewed, fetchDailyTipSuggestions, type DailyTip, type DailyTipSuggestion, type DailyTipSuggestedTool } from '../../api/dailyTip';
import { fetchParentStreak, type ParentStreak } from '../../api/parentStreak';
import { fetchDomainProgress, type DomainProgressItem } from '../../api/domainProgress';
import { EMOTIONAL_DOMAINS } from '../../constants/emotionalDomains';
import { DOMAIN_INSIGHTS } from '../../constants/domainInsights';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { HeaderBar } from '../../components/layout/HeaderBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FAB } from '../../components/ui/FAB';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { colors, getDomainColor } from '../../design/colors';
import { spacing, layout } from '../../theme';
import { typography } from '../../theme/typography';
import { getParentInsight } from '../../utils/parentInsight';
import type { ParentTabParamList } from '../../types/navigation';
import type { ParentStackParamList } from '../../types/navigation';

const ADVICE_SUMMARY_LENGTH = 120;
const TIP_PREVIEW_LENGTH = 100;

function getAdviceSummary(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= ADVICE_SUMMARY_LENGTH) return trimmed;
  return trimmed.slice(0, ADVICE_SUMMARY_LENGTH).trim() + '…';
}

function getTipPreview(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= TIP_PREVIEW_LENGTH) return trimmed;
  return trimmed.slice(0, TIP_PREVIEW_LENGTH).trim() + '…';
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
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
  const [dailyTipViewed, setDailyTipViewed] = useState(false);
  const [dailyTipLoading, setDailyTipLoading] = useState(true);
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [streak, setStreak] = useState<ParentStreak | null>(null);
  const [tipSuggestions, setTipSuggestions] = useState<{ suggested_activity: DailyTipSuggestion | null; suggested_article: DailyTipSuggestion | null; suggested_tool?: DailyTipSuggestedTool | null } | null>(null);
  const [domainProgress, setDomainProgress] = useState<DomainProgressItem[] | null>(null);
  const [domainProgressLoading, setDomainProgressLoading] = useState(false);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ childName: string; domainTitle: string; levelLabel: string } | null>(null);
  const [expandedInsightDomainId, setExpandedInsightDomainId] = useState<string | null>(null);
  const previousDomainLevels = useRef<Record<string, Record<string, number>>>({});

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

  const loadDailyTip = useCallback(async () => {
    setDailyTipLoading(true);
    try {
      const { tip, viewed_today } = await fetchDailyTip();
      setDailyTip(tip);
      setDailyTipViewed(viewed_today ?? false);
    } catch {
      setDailyTip(null);
      setDailyTipViewed(false);
    } finally {
      setDailyTipLoading(false);
    }
  }, []);

  const loadParentStreak = useCallback(async () => {
    try {
      const s = await fetchParentStreak();
      setStreak(s);
    } catch {
      setStreak(null);
    }
  }, []);

  const loadDomainProgress = useCallback(async () => {
    if (!selectedChildId) {
      setDomainProgress(null);
      return;
    }
    setDomainProgressLoading(true);
    try {
      const { domains } = await fetchDomainProgress(selectedChildId);
      const childName = children.find((c) => c.id === selectedChildId)?.name ?? 'Your child';
      const prevLevels = previousDomainLevels.current[selectedChildId] ?? {};
      for (const d of domains) {
        const prev = prevLevels[d.domain_id];
        if (prev !== undefined && d.level > prev && d.level >= 1) {
          const domainTitle = EMOTIONAL_DOMAINS.find((x) => x.id === d.domain_id)?.title ?? d.domain_id;
          setLevelUpCelebration({ childName, domainTitle, levelLabel: d.level_label });
          break;
        }
      }
      const next: Record<string, number> = {};
      for (const d of domains) {
        next[d.domain_id] = d.level;
      }
      previousDomainLevels.current[selectedChildId] = next;
      setDomainProgress(domains);
    } catch {
      setDomainProgress(null);
    } finally {
      setDomainProgressLoading(false);
    }
  }, [selectedChildId, children]);

  const openTipDetail = useCallback(async () => {
    if (!dailyTip) return;
    setTipModalVisible(true);
    setTipSuggestions(null);
    try {
      await recordDailyTipViewed();
      setDailyTipViewed(true);
      await loadParentStreak();
      const sug = await fetchDailyTipSuggestions();
      setTipSuggestions(sug);
    } catch {
      // non-blocking
    }
  }, [dailyTip, loadParentStreak]);

  const openContentDetail = useCallback(
    (contentId: string) => {
      setTipModalVisible(false);
      const stack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();
      stack?.navigate('ContentDetail', { contentId });
    },
    [navigation]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshSummary();
      loadAdvice();
      loadDailyTip();
      loadParentStreak();
      loadDomainProgress();
    }, [refresh, refreshSummary, loadAdvice, loadDailyTip, loadParentStreak, loadDomainProgress])
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
    loadDailyTip();
    loadParentStreak();
    loadDomainProgress();
  }, [refresh, refreshSummary, loadAdvice, loadDailyTip, loadParentStreak, loadDomainProgress]);

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.parentAccent} />}
      >
        <HeaderBar title="Dashboard" subtitle={`Hello, ${user?.name ?? 'Parent'}!`} />

        <Card style={styles.insightCard} variant="elevated" accentColor={colors.primary}>
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

        <Card style={styles.tipCard} variant="glow" accentColor={colors.primary}>
          <Text style={styles.tipCardLabel}>Today’s parenting tip</Text>
          {dailyTipLoading && !dailyTip ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.tipLoader} />
          ) : dailyTip ? (
            <>
              {dailyTipViewed ? (
                <>
                  <Text style={styles.tipSeenToday}>✔ Seen today</Text>
                  {streak && streak.current_streak > 0 ? (
                    <Text style={styles.tipStreak}>🔥 {streak.current_streak}-day streak</Text>
                  ) : null}
                  {streak && streak.current_streak >= 7 ? (
                    <Text style={styles.tipMilestone}>🎉 {streak.current_streak}-day milestone! You’re building a strong habit.</Text>
                  ) : null}
                </>
              ) : null}
              <Text style={styles.tipCardTitle}>{dailyTip.title}</Text>
              <Text style={styles.tipCardPreview} numberOfLines={2}>
                {getTipPreview(dailyTip.content)}
              </Text>
              {dailyTip.psychology_basis ? (
                <Text style={styles.tipCardBasis}>{dailyTip.psychology_basis}</Text>
              ) : null}
              {dailyTipViewed ? (
                <Text style={styles.tipEncouragement}>You’re building a habit of small, supportive moments.</Text>
              ) : null}
              <Button
                title="Try this today"
                onPress={openTipDetail}
                variant="outline"
                style={styles.tipCardButton}
              />
            </>
          ) : (
            <Text style={styles.tipCardEmpty}>No tip for today. Check back tomorrow.</Text>
          )}
        </Card>

        <Card style={styles.adviceCard} variant="glow" accentColor={colors.parentAccent}>
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
          <Card style={styles.dashboardCard} variant="elevated">
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
                    <Text style={styles.emotionInsightText}>{getEmotionInsight(summary.last_emotion.emotion)}</Text>
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

        {levelUpCelebration ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setLevelUpCelebration(null)}
            style={styles.levelUpBanner}
          >
            <Text style={styles.levelUpBannerText}>
              🎉 {levelUpCelebration.childName} reached {levelUpCelebration.levelLabel} in {levelUpCelebration.domainTitle}!
            </Text>
          </TouchableOpacity>
        ) : null}
        {selectedChild && (
          <View style={styles.domainSection}>
            <Text style={styles.domainCardTitle}>Emotional Growth Overview</Text>
            <Text style={styles.domainCardSubtitle}>Emotional skills grow through consistent practice.</Text>
            {domainProgressLoading && !domainProgress ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.domainLoader} />
            ) : domainProgress ? (
              EMOTIONAL_DOMAINS.map((domain) => {
                const prog = domainProgress.find((d) => d.domain_id === domain.id);
                const sessions = prog?.sessions_completed ?? 0;
                const stars = prog?.total_stars ?? prog?.stars_earned ?? 0;
                const levelLabel = prog?.level_label ?? 'Starting';
                const barMax = 10;
                const barPct = Math.min(1, sessions / barMax);
                const domainColor = getDomainColor(domain.id);
                const insightConfig = DOMAIN_INSIGHTS[domain.id];
                const showInsight = sessions >= 5 && insightConfig;
                const insightTier = sessions >= 10 ? 'strong' : 'growing';
                const insight = showInsight ? insightConfig[insightTier] : null;
                const isExpanded = expandedInsightDomainId === domain.id;
                return (
                  <Card key={domain.id} variant="domain" accentColor={domainColor} style={styles.domainCardItem}>
                    <View style={styles.domainRow}>
                      <Text style={[styles.domainLabel, { color: domainColor }]}>{domain.title}</Text>
                      <Badge label={levelLabel} variant="domain" color={domainColor} />
                    </View>
                    <ProgressBar progress={barPct} fillColor={domainColor} height={10} animated />
                    <Text style={styles.domainMeta}>{stars} stars · {sessions} session{sessions !== 1 ? 's' : ''}</Text>
                    {showInsight && insight && (
                      <>
                        <TouchableOpacity
                          style={styles.insightToggle}
                          onPress={() => setExpandedInsightDomainId(isExpanded ? null : domain.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.insightToggleText}>
                            {isExpanded ? 'Hide' : 'Show'} Growth Insight
                          </Text>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={styles.insightBlock}>
                            <Text style={styles.insightTitle}>Growth Insight</Text>
                            <Text style={styles.insightMessage}>{insight.message}</Text>
                            <Text style={styles.insightExplanation}>{insight.explanation}</Text>
                            <View style={styles.insightPromptBox}>
                              <Text style={styles.insightPromptLabel}>Conversation prompt</Text>
                              <Text style={styles.insightPrompt}>{insight.prompt}</Text>
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </Card>
                );
              })
            ) : (
              <Card style={styles.domainCardItem}><Text style={styles.domainEmpty}>No domain progress yet.</Text></Card>
            )}
          </View>
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
          <View style={styles.childSelectorRow}>
            {children.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedChild(c.id)}
                activeOpacity={0.8}
                style={[styles.childSelectorItem, selectedChildId === c.id && styles.childSelectorItemSelected]}
              >
                <Avatar name={c.name} size={56} />
                <Text style={styles.childSelectorName} numberOfLines={1}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={handleAddChild} style={styles.childSelectorAdd} activeOpacity={0.8}>
              <Text style={styles.childSelectorAddText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        )}
        {selectedChild && children.some((c) => c.id === selectedChildId) && (
          <TouchableOpacity onPress={() => handleRemoveChild(selectedChildId!, selectedChild!.name)} style={styles.removeChildLink}>
            <Text style={styles.removeChildText}>Remove selected child's profile</Text>
          </TouchableOpacity>
        )}

        <Card style={styles.card} title="Quick actions" subtitle="Practice, appointments, and resources.">
          <TouchableOpacity onPress={() => parentStack?.navigate('MyAppointments')} style={styles.quickActionLink}>
            <Text style={styles.quickActionLinkText}>My appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => parentStack?.navigate('ParentResources')} style={styles.quickActionLink}>
            <Text style={styles.quickActionLinkText}>Parent resources</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => parentStack?.navigate('TrustAndSafety')} style={styles.quickActionLink}>
            <Text style={styles.quickActionLinkText}>Trust & safety</Text>
          </TouchableOpacity>
        </Card>

        <Button
          title="Use app as Child"
          onPress={handleUseAsChild}
          variant="outline"
          style={styles.switchBtn}
        />

        <TouchableOpacity
          onPress={() => (parentStack?.getParent() as { navigate: (name: string) => void } | undefined)?.navigate('RoleSelect')}
          style={styles.switchModeLink}
        >
          <Text style={styles.switchModeText}>Switch mode (Parent / Child / Therapist / Admin)</Text>
        </TouchableOpacity>

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
      <FAB label="Add child" onPress={handleAddChild} icon="+" />

      <Modal
        visible={tipModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTipModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTipModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{dailyTip?.title ?? 'Tip'}</Text>
              <TouchableOpacity onPress={() => setTipModalVisible(false)} hitSlop={12}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            {dailyTip?.psychology_basis ? (
              <Text style={styles.modalBasis}>{dailyTip.psychology_basis}</Text>
            ) : null}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBody}>{dailyTip?.content ?? ''}</Text>
              {(tipSuggestions?.suggested_activity || tipSuggestions?.suggested_article || tipSuggestions?.suggested_tool) ? (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsTitle}>Suggested for you</Text>
                  {tipSuggestions.suggested_tool ? (
                    <View style={styles.suggestionCard}>
                      <Text style={styles.suggestionCardLabel}>Practice with your child</Text>
                      <Text style={styles.suggestionCardTitle} numberOfLines={2}>{tipSuggestions.suggested_tool.title}</Text>
                      <Text style={styles.suggestionCardSummary}>Try this skill-building tool in Child mode.</Text>
                    </View>
                  ) : null}
                  {tipSuggestions.suggested_activity ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => openContentDetail(tipSuggestions.suggested_activity!.id)}
                      style={styles.suggestionCard}
                    >
                      <Text style={styles.suggestionCardLabel}>Activity</Text>
                      <Text style={styles.suggestionCardTitle} numberOfLines={2}>{tipSuggestions.suggested_activity.title}</Text>
                      {tipSuggestions.suggested_activity.summary ? (
                        <Text style={styles.suggestionCardSummary} numberOfLines={1}>{tipSuggestions.suggested_activity.summary}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ) : null}
                  {tipSuggestions.suggested_article ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => openContentDetail(tipSuggestions.suggested_article!.id)}
                      style={styles.suggestionCard}
                    >
                      <Text style={styles.suggestionCardLabel}>Article</Text>
                      <Text style={styles.suggestionCardTitle} numberOfLines={2}>{tipSuggestions.suggested_article.title}</Text>
                      {tipSuggestions.suggested_article.summary ? (
                        <Text style={styles.suggestionCardSummary} numberOfLines={1}>{tipSuggestions.suggested_article.summary}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    padding: layout.screenPadding,
    paddingBottom: layout.fabContentPaddingBottom,
  },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: layout.sectionGapSmall },
  insightCard: {
    marginBottom: layout.sectionGapSmall,
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
  tipCard: { marginBottom: layout.sectionGapSmall },
  tipCardLabel: { ...typography.label, color: colors.primary, marginBottom: spacing.xs },
  tipSeenToday: { ...typography.caption, color: colors.success, marginBottom: spacing.xs },
  tipStreak: { ...typography.caption, color: colors.text, marginBottom: spacing.xs },
  tipMilestone: { ...typography.subtitle, color: colors.primary, fontWeight: '600', marginBottom: spacing.sm },
  tipCardTitle: { ...typography.h3, marginBottom: spacing.sm },
  tipCardPreview: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  tipCardBasis: { ...typography.caption, color: colors.primary, marginBottom: spacing.sm },
  tipEncouragement: { ...typography.subtitle, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.sm },
  tipCardButton: { alignSelf: 'flex-start' },
  tipCardEmpty: { ...typography.bodySmall, color: colors.textSecondary },
  tipLoader: { marginVertical: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { ...typography.h3, flex: 1, paddingRight: spacing.sm },
  modalClose: { ...typography.body, color: colors.primary, fontWeight: '600' },
  modalBasis: { ...typography.caption, color: colors.primary, marginBottom: spacing.md },
  modalScroll: { maxHeight: 320 },
  modalBody: { ...typography.body, color: colors.text, lineHeight: 24 },
  suggestionsSection: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  suggestionsTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  suggestionCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  suggestionCardLabel: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  suggestionCardTitle: { ...typography.body, fontWeight: '600', color: colors.text },
  suggestionCardSummary: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  adviceCard: { marginBottom: layout.sectionGapSmall },
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
  emotionInsightText: { ...typography.caption, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  recentSection: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  recentTitle: { ...typography.label, marginBottom: spacing.sm },
  recentRow: { marginBottom: spacing.sm },
  recentActivity: { ...typography.subtitle, fontWeight: '600', color: colors.text },
  recentMeta: { ...typography.caption, marginTop: 2 },
  noActivity: { ...typography.subtitle },
  levelUpBanner: { backgroundColor: colors.primaryLight, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, marginBottom: spacing.sm },
  levelUpBannerText: { ...typography.subtitle, color: colors.text, textAlign: 'center' },
  domainSection: { marginBottom: spacing.lg },
  domainCardTitle: { ...typography.SectionTitle, marginBottom: spacing.xs },
  domainCardSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  domainCardItem: { marginBottom: spacing.sm },
  domainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  domainLabel: { ...typography.subtitle, fontWeight: '600', flex: 1 },
  domainMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  domainEmpty: { ...typography.bodySmall, color: colors.textSecondary },
  domainLoader: { marginVertical: spacing.sm },
  childSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  childSelectorItem: { alignItems: 'center', minWidth: 72, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  childSelectorItemSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceSoft },
  childSelectorName: { ...typography.Caption, marginTop: spacing.sm, maxWidth: 72, textAlign: 'center' },
  childSelectorAdd: { alignItems: 'center', justifyContent: 'center', minWidth: 72, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: 12, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  childSelectorAddText: { ...typography.Caption, color: colors.textSecondary },
  insightToggle: { marginTop: spacing.sm },
  insightToggleText: { ...typography.caption, color: colors.primary, textDecorationLine: 'underline' },
  insightBlock: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  insightTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  insightMessage: { ...typography.subtitle, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  insightExplanation: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 20 },
  insightPromptBox: { backgroundColor: colors.surfaceSubtle, padding: spacing.md, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.parentAccent },
  insightPromptLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  insightPrompt: { ...typography.bodySmall, color: colors.text, fontStyle: 'italic' },
  sectionTitle: { ...typography.h3, fontSize: 16, marginBottom: spacing.sm },
  card: { marginBottom: layout.listItemGap },
  cardSelected: { borderColor: colors.parentAccent, borderWidth: 2 },
  childName: { ...typography.body, fontWeight: '600' },
  childMeta: { ...typography.caption, marginTop: 2 },
  cardTitle: { ...typography.h3 },
  cardDesc: { ...typography.subtitle, marginTop: spacing.xs },
  quickActionLink: { marginTop: spacing.sm },
  quickActionLinkText: { ...typography.body, color: colors.primary, textDecorationLine: 'underline' },
  hint: { ...typography.subtitle, marginBottom: spacing.sm },
  errorText: { ...typography.error, marginBottom: spacing.sm },
  retryBtn: { alignSelf: 'flex-start' },
  addBtn: { marginTop: spacing.sm },
  addAnother: { marginBottom: spacing.md },
  removeChildLink: { marginTop: -spacing.sm, marginBottom: spacing.sm, paddingVertical: spacing.xs },
  removeChildText: { ...typography.caption, color: colors.error },
  switchBtn: { marginTop: spacing.md },
  switchModeLink: { marginTop: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  switchModeText: { ...typography.link, fontSize: 14 },
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
