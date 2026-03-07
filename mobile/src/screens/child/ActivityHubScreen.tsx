import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { fetchDomainProgress, type DomainProgressItem } from '../../api/domainProgress';
import { EMOTIONAL_DOMAINS } from '../../constants/emotionalDomains';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, getDomainColor } from '../../theme/colors';
import { spacing, layout } from '../../theme';
import { typography } from '../../theme/typography';
import type { ChildTabParamList, ChildStackParamList } from '../../types/navigation';

const CONTENT_INSET = 20;
const TAB_PADDING_BOTTOM = 100;

type TabNav = NativeStackNavigationProp<ChildTabParamList, 'ActivityHub'>;
type StackNav = NativeStackNavigationProp<ChildStackParamList, 'Main'>;

function formatLastPracticed(iso: string | null): string {
  if (!iso) return 'Not yet';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 24 * 60 * 60 * 1000) return 'Today';
  if (diff < 2 * 24 * 60 * 60 * 1000) return 'Yesterday';
  if (diff < 7 * 24 * 60 * 60 * 1000) return 'This week';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ActivityHubScreen() {
  const navigation = useNavigation<TabNav>();
  const stackNav = useNavigation<StackNav>();
  const { setAppRole, pendingActivityId, setPendingActivityId, selectedChildId } = useAuth();
  const { children } = useChildren();
  const [progressByDomain, setProgressByDomain] = useState<Record<string, DomainProgressItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const childId = selectedChildId ?? children[0]?.id ?? null;

  const load = useCallback(async () => {
    if (!childId) {
      setProgressByDomain({});
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { domains } = await fetchDomainProgress(childId);
      const map: Record<string, DomainProgressItem> = {};
      for (const d of domains) {
        map[d.domain_id] = d;
      }
      setProgressByDomain(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load progress');
      setProgressByDomain({});
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useFocusEffect(
    useCallback(() => {
      if (pendingActivityId) {
        setPendingActivityId(null);
        (navigation.getParent() as any)?.navigate('Activity', { activityId: pendingActivityId });
      }
    }, [pendingActivityId, setPendingActivityId, navigation])
  );

  useEffect(() => {
    load();
  }, [load]);

  const openDomain = (domainId: string) => {
    stackNav.navigate('DomainDetail', { domainId });
  };

  if (!childId && children.length === 0) {
    return (
      <ScreenLayout edgeToEdge>
        <View style={styles.sectionBlock}>
          <Text style={styles.title}>Activity Hub</Text>
          <Card style={styles.card}>
            <Text style={styles.emptyText}>Add a child in parent mode to start building skills.</Text>
          </Card>
          <Button title="Back to Parent mode" onPress={() => setAppRole('parent')} variant="ghost" style={styles.switchBtn} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false} edgeToEdge>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.childAccent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionBlock}>
          <Text style={styles.title}>Build Your Skills</Text>
          <Text style={styles.subtitle}>Practice in each area to grow stronger every day.</Text>

        {loading && Object.keys(progressByDomain).length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.childAccent} />
          </View>
        ) : error ? (
          <Card style={styles.card} variant="outlined">
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" onPress={load} variant="outline" style={styles.retryBtn} />
          </Card>
        ) : (
          EMOTIONAL_DOMAINS.map((domain) => {
            const prog = progressByDomain[domain.id];
            const sessions = prog?.sessions_completed ?? 0;
            const stars = prog?.total_stars ?? 0;
            const lastAt = prog?.last_practiced_at ?? null;
            return (
              <TouchableOpacity
                key={domain.id}
                activeOpacity={0.82}
                onPress={() => openDomain(domain.id)}
              >
                <Card style={styles.card} variant="domain" accentColor={getDomainColor(domain.id)}>
                  <Text style={styles.domainTitle}>{domain.title}</Text>
                  <Text style={styles.domainDesc} numberOfLines={2}>
                    {domain.description}
                  </Text>
                  <View style={styles.stats}>
                    <Text style={styles.statText}>{sessions} session{sessions !== 1 ? 's' : ''} completed</Text>
                    <Text style={styles.statText}>★ {stars} stars</Text>
                    <Text style={styles.metaText}>Last: {formatLastPracticed(lastAt)}</Text>
                  </View>
                  <Button title="Practice" onPress={() => openDomain(domain.id)} size="small" style={styles.practiceBtn} />
                </Card>
              </TouchableOpacity>
            );
          })
        )}

          <Button
            title="Back to Parent mode"
            onPress={() => setAppRole('parent')}
            variant="ghost"
            style={styles.switchBtn}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 0, paddingBottom: TAB_PADDING_BOTTOM },
  sectionBlock: { paddingHorizontal: CONTENT_INSET, marginBottom: layout.sectionGap },
  title: { ...typography.h2, color: colors.childAccent, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, marginBottom: layout.sectionGapSmall },
  card: { marginBottom: layout.listItemGap },
  domainTitle: { ...typography.h3, marginBottom: spacing.xs },
  domainDesc: { ...typography.subtitle, color: colors.textSecondary, marginBottom: spacing.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  statText: { ...typography.caption, color: colors.text },
  metaText: { ...typography.caption, color: colors.textTertiary },
  practiceBtn: { alignSelf: 'flex-start' },
  errorText: { ...typography.error, marginBottom: spacing.sm },
  retryBtn: { alignSelf: 'flex-start' },
  emptyText: { ...typography.subtitle, color: colors.textSecondary },
  centered: { padding: spacing.xl, alignItems: 'center' },
  switchBtn: { marginTop: spacing.lg },
});
