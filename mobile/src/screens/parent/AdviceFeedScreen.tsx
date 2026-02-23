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
import { spacing } from '../../theme/spacing';

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
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
  centered: { paddingVertical: spacing.xxl, alignItems: 'center' },
  loadingText: { marginTop: spacing.sm, fontSize: 15, color: colors.textSecondary },
  card: { marginBottom: spacing.md },
  errorText: { fontSize: 16, color: colors.error },
  hint: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  featured: { marginBottom: spacing.lg },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.parentAccent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.surface },
  adviceTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 28,
  },
  adviceContent: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  psychologyCard: { marginBottom: spacing.md },
  psychologyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  psychologyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  ageRange: { fontSize: 13, color: colors.textSecondary },
  tryActivityBtn: { marginTop: spacing.lg },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
