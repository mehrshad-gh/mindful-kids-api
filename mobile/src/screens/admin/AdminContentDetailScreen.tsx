import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAdminContent, updateAdminContent, type AdminContentItem } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminContentDetail'>;

export function AdminContentDetailScreen({ route }: Props) {
  const { contentId } = route.params;
  const [item, setItem] = useState<AdminContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { item: data } = await getAdminContent(contentId);
      setItem(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const setPublish = useCallback(
    async (isPublished: boolean) => {
      if (!item) return;
      setActionLoading(true);
      try {
        const { item: updated } = await updateAdminContent(item.id, {
          is_published: isPublished,
        });
        setItem(updated);
      } catch (e) {
        Alert.alert(
          'Update failed',
          e instanceof Error ? e.message : 'Could not update publish status'
        );
      } finally {
        setActionLoading(false);
      }
    },
    [item]
  );

  const handlePublish = () => {
    Alert.alert(
      'Publish',
      'This content will be visible to parents and in the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: () => setPublish(true) },
      ]
    );
  };

  const handleUnpublish = () => {
    Alert.alert(
      'Unpublish',
      'This content will be hidden from the app. You can publish again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unpublish', onPress: () => setPublish(false) },
      ]
    );
  };

  if (loading && !item) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !item) {
    return (
      <ScreenLayout>
        <Card style={styles.card}>
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusRow}>
          <View style={[styles.badge, item.is_published ? styles.badgePublished : styles.badgeDraft]}>
            <Text style={styles.badgeText}>{item.is_published ? 'Published' : 'Draft'}</Text>
          </View>
          {item.published_at ? (
            <Text style={styles.publishedAt}>
              Published {new Date(item.published_at).toLocaleDateString()}
            </Text>
          ) : null}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{item.type} {item.age_range ? ` · Ages ${item.age_range}` : ''}</Text>
        {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}

        <View style={styles.actions}>
          {item.is_published ? (
            <Button
              title="Unpublish"
              onPress={handleUnpublish}
              variant="outline"
              disabled={actionLoading}
              style={styles.btn}
            />
          ) : (
            <Button
              title="Publish"
              onPress={handlePublish}
              disabled={actionLoading}
              style={styles.btn}
            />
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  badge: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: 6 },
  badgePublished: { backgroundColor: colors.successMuted },
  badgeDraft: { backgroundColor: colors.surfaceSubtle },
  badgeText: { ...typography.caption, fontWeight: '600' },
  publishedAt: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  meta: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  summary: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {},
  card: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.text },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
