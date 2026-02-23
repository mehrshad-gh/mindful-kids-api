import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchFeaturedAdvice, type AdviceItem } from '../../api/advice';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme';
import { typography } from '../../theme/typography';

export function AdviceFeedScreen() {
  const { setAppRole, setPendingActivityId } = useAuth();
  const [featured, setFeatured] = useState<AdviceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const item = await fetchFeaturedAdvice();
      setFeatured(item);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load advice');
      setFeatured(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.parentAccent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Daily Advice</Text>
        <Text style={styles.subtitle}>Evidence-based tips for parenting and child wellbeing.</Text>

        {loading && !featured ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.parentAccent} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.hint}>Pull down to try again.</Text>
          </Card>
        ) : featured ? (
          <View style={styles.featured}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Today’s tip</Text>
            </View>
            <Text style={styles.adviceTitle}>{featured.title}</Text>
            <Text style={styles.adviceContent}>{featured.content}</Text>
            {featured.psychology_basis ? (
              <Card style={styles.psychologyCard}>
                <Text style={styles.psychologyLabel}>Why it works</Text>
                <Text style={styles.psychologyText}>{featured.psychology_basis}</Text>
              </Card>
            ) : null}
            {featured.age_range ? (
              <Text style={styles.ageRange}>Ages {featured.age_range}</Text>
            ) : null}
            {featured.related_activity_id ? (
              <Button
                title="Try this with your child"
                onPress={() => {
                  setPendingActivityId(featured.related_activity_id!);
                  setAppRole('child');
                }}
                style={styles.tryActivityBtn}
              />
            ) : null}
          </View>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No advice available yet. Check back later.</Text>
          </Card>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  centered: { paddingVertical: spacing.xxl, alignItems: 'center' },
  loadingText: { ...typography.bodySmall, marginTop: spacing.sm, color: colors.textSecondary },
  card: { marginBottom: layout.listItemGap },
  errorText: { ...typography.error },
  hint: { ...typography.subtitle, marginTop: spacing.xs },
  featured: { marginBottom: spacing.lg },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.parentAccent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  badgeText: { ...typography.caption, fontWeight: '700', color: colors.surface },
  adviceTitle: { ...typography.h2, marginBottom: spacing.md, lineHeight: 28 },
  adviceContent: { ...typography.body, marginBottom: spacing.lg },
  psychologyCard: { marginBottom: layout.listItemGap },
  psychologyLabel: { ...typography.label, marginBottom: spacing.xs },
  psychologyText: { ...typography.bodySmall },
  ageRange: { ...typography.caption, fontSize: 13 },
  tryActivityBtn: { marginTop: spacing.lg },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
