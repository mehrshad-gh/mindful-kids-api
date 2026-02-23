import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { fetchActivities, type Activity } from '../../services/activitiesService';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme';
import { typography } from '../../theme/typography';
import type { ChildTabParamList } from '../../types/navigation';

export function ActivityHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChildTabParamList, 'ActivityHub'>>();
  const { setAppRole, pendingActivityId, setPendingActivityId } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (pendingActivityId) {
        setPendingActivityId(null);
        navigation.navigate('Activity', { activityId: pendingActivityId });
      }
    }, [pendingActivityId, setPendingActivityId, navigation])
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await fetchActivities({ active: true });
      setActivities(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.childAccent} />
        }
      >
        <Text style={styles.title}>Activity Hub</Text>
        <Text style={styles.subtitle}>Psychology-based activities: CPRT, CBT, DBT, ACT.</Text>

        {loading && activities.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.childAccent} />
          </View>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" onPress={load} variant="outline" style={styles.retryBtn} />
          </Card>
        ) : activities.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No activities yet. Check back later!</Text>
          </Card>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Activity', { activityId: activity.id })}
            >
              <Card style={styles.card}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.description ? (
                  <Text style={styles.activityDesc} numberOfLines={2}>
                    {activity.description}
                  </Text>
                ) : null}
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{activity.activity_type}</Text>
                  {activity.duration_minutes != null && (
                    <Text style={styles.metaText}> • {activity.duration_minutes} min</Text>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        <Button
          title="Back to Parent mode"
          onPress={() => setAppRole('parent')}
          variant="ghost"
          style={styles.switchBtn}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, marginBottom: spacing.lg },
  card: { marginBottom: layout.listItemGap },
  activityTitle: { ...typography.h3 },
  activityDesc: { ...typography.subtitle, marginTop: spacing.xs },
  meta: { flexDirection: 'row', marginTop: spacing.xs },
  metaText: { ...typography.caption },
  errorText: { ...typography.error, marginBottom: spacing.sm },
  retryBtn: { alignSelf: 'flex-start' },
  emptyText: { ...typography.subtitle },
  centered: { padding: spacing.xl, alignItems: 'center' },
  switchBtn: { marginTop: spacing.lg },
});
