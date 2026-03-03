import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EMOTIONAL_DOMAINS } from '../../constants/emotionalDomains';
import { fetchActivities, type Activity } from '../../services/activitiesService';
import { fetchDomainProgress, type DomainProgressItem } from '../../api/domainProgress';
import { useAuth } from '../../context/AuthContext';
import type { ChildStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme';
import { typography } from '../../theme/typography';

const LEVEL_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Starting: { bg: '#F4F4F5', text: '#71717A' },
  Explorer: { bg: '#DBEAFE', text: '#1D4ED8' },
  Builder: { bg: '#EDE9FE', text: '#6D28D9' },
  Confident: { bg: '#D1FAE5', text: '#059669' },
};

type Route = RouteProp<ChildStackParamList, 'DomainDetail'>;
type Nav = NativeStackNavigationProp<ChildStackParamList, 'DomainDetail'>;

export function DomainDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { domainId } = route.params;
  const { selectedChildId } = useAuth();
  const domain = EMOTIONAL_DOMAINS.find((d) => d.id === domainId);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [domainProgress, setDomainProgress] = useState<DomainProgressItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await fetchActivities({ active: true, domain_id: domainId });
      setActivities(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  const loadProgress = useCallback(async () => {
    if (!selectedChildId) {
      setDomainProgress(null);
      return;
    }
    try {
      const { domains } = await fetchDomainProgress(selectedChildId);
      const prog = domains.find((d) => d.domain_id === domainId) ?? null;
      setDomainProgress(prog);
    } catch {
      setDomainProgress(null);
    }
  }, [selectedChildId, domainId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const load = useCallback(() => {
    loadActivities();
    loadProgress();
  }, [loadActivities, loadProgress]);

  if (!domain) {
    return (
      <ScreenLayout>
        <Text style={styles.errorText}>Unknown domain.</Text>
      </ScreenLayout>
    );
  }

  const sessions = domainProgress?.sessions_completed ?? 0;
  const levelLabel = domainProgress?.level_label ?? 'Starting';
  const levelColors = LEVEL_BADGE_COLORS[levelLabel] ?? LEVEL_BADGE_COLORS.Starting;
  const progressPct = Math.min(1, sessions / 10);

  return (
    <ScreenLayout>
      <Text style={styles.title}>{domain.title}</Text>
      <Text style={styles.description}>{domain.description}</Text>

      {selectedChildId ? (
        <View style={styles.levelSection}>
          <View style={[styles.levelBadge, { backgroundColor: levelColors.bg }]}>
            <Text style={[styles.levelBadgeText, { color: levelColors.text }]}>{levelLabel}</Text>
          </View>
          <Text style={styles.sessionsText}>{sessions} session{sessions !== 1 ? 's' : ''} completed</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct * 100}%` }]} />
          </View>
        </View>
      ) : null}

      {loading && activities.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.childAccent} />
        </View>
      ) : error ? (
        <Card style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={load} variant="outline" />
        </Card>
      ) : activities.length === 0 ? (
        <Card style={styles.card} variant="outlined">
          <Text style={styles.emptyText}>No activities in this skill area yet. Check back later!</Text>
        </Card>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.childAccent} />}
          showsVerticalScrollIndicator={false}
        >
          {activities.map((activity) => (
            <Card key={activity.id} style={styles.toolCard} variant="elevated" accentColor={colors.childAccent}>
              <Text style={styles.toolTitle}>{activity.title}</Text>
              {activity.description ? (
                <Text style={styles.toolDesc} numberOfLines={2}>
                  {activity.description}
                </Text>
              ) : null}
              <View style={styles.toolMeta}>
                {activity.duration_minutes != null && (
                  <Text style={styles.metaText}>{activity.duration_minutes} min</Text>
                )}
                <Text style={styles.starsHint}>Earn stars when you complete it!</Text>
              </View>
              <Button
                title="Start"
                onPress={() =>
                  navigation.navigate('Main', { screen: 'Activity', params: { activityId: activity.id } })
                }
                style={styles.startBtn}
              />
            </Card>
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  levelSection: { marginBottom: layout.sectionGapSmall },
  levelBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  levelBadgeText: { ...typography.label, fontWeight: '600' },
  sessionsText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xs },
  progressBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.childAccent, borderRadius: 3 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  toolCard: { marginBottom: layout.listItemGap },
  toolTitle: { ...typography.h3, marginBottom: spacing.xs },
  toolDesc: { ...typography.subtitle, color: colors.textSecondary, marginBottom: spacing.sm },
  toolMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  metaText: { ...typography.caption, color: colors.textTertiary },
  starsHint: { ...typography.caption, color: colors.childAccent },
  startBtn: { alignSelf: 'flex-start' },
  emptyText: { ...typography.body, color: colors.textSecondary },
  errorText: { ...typography.body, color: colors.error, marginBottom: spacing.sm },
  centered: { padding: spacing.xl, alignItems: 'center' },
});
