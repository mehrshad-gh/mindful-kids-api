import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { CompleteActivityBlock } from '../../components/CompleteActivityBlock';
import { EmotionWheelActivity } from '../../components/EmotionWheelActivity';
import { useAuth } from '../../context/AuthContext';
import { fetchActivityById, type Activity } from '../../services/activitiesService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ChildTabParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<ChildTabParamList, 'Activity'>;
  route: RouteProp<ChildTabParamList, 'Activity'>;
};

function formatInstructions(instructions: string | null): string[] {
  if (!instructions || !instructions.trim()) return [];
  return instructions
    .split(/\n+/)
    .map((s) => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

export function ActivityScreen({ route }: Props) {
  const activityId = route.params?.activityId;
  const { selectedChildId } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(!!activityId);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityById(activityId);
      setActivity(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load activity');
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!activityId) {
    return (
      <ScreenLayout>
        <Text style={styles.title}>Do an activity</Text>
        <Card style={styles.card}>
          <Text style={styles.placeholder}>
            Open an activity from the Activity Hub, then come here to do it and earn stars.
          </Text>
        </Card>
      </ScreenLayout>
    );
  }

  if (loading && !activity) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.childAccent} />
          <Text style={styles.loadingText}>Loading activity…</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !activity) {
    return (
      <ScreenLayout>
        <Text style={styles.title}>Activity</Text>
        <Card style={styles.card}>
          <Text style={styles.errorText}>{error ?? 'Activity not found'}</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const steps = formatInstructions(activity.instructions);

  if (activity.slug === 'emotion-wheel') {
    return (
      <ScreenLayout scroll={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.childAccent} />
          }
          showsVerticalScrollIndicator={false}
        >
          <EmotionWheelActivity
            activityId={activity.id}
            activityTitle={activity.title}
            activityDescription={activity.description}
            instructions={activity.instructions ?? undefined}
            childId={selectedChildId}
          />
        </ScrollView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.childAccent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>{activity.title}</Text>
          {activity.duration_minutes != null && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⏱ {activity.duration_minutes} min</Text>
            </View>
          )}
        </View>

        {activity.description ? (
          <Card style={styles.card}>
            <Text style={styles.description}>{activity.description}</Text>
          </Card>
        ) : null}

        {steps.length > 0 ? (
          <Card style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>What to do</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={styles.completeSection}>
          <Text style={styles.completeTitle}>When you're done</Text>
          <Text style={styles.completeSubtitle}>Rate how it went and save your stars!</Text>
          <CompleteActivityBlock
            activityId={activity.id}
            activityTitle="Rate & save"
            childId={selectedChildId}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: 16, color: colors.textSecondary },
  header: { marginBottom: spacing.lg, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  badge: {
    marginTop: spacing.sm,
    backgroundColor: colors.childAccent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  badgeText: { fontSize: 14, fontWeight: '700', color: colors.surface },
  card: { marginBottom: spacing.md },
  placeholder: { fontSize: 16, color: colors.textSecondary },
  errorText: { color: colors.error, fontSize: 16 },
  description: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  instructionsCard: { marginBottom: spacing.lg },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-start' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.childAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: { fontSize: 14, fontWeight: '800', color: colors.surface },
  stepText: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.text },
  completeSection: { marginTop: spacing.sm },
  completeTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  completeSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.md },
});
