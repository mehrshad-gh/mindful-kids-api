import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { MarkdownBody } from '../../components/content/MarkdownBody';
import { fetchContentItem, type ContentItem } from '../../api/content';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ParentStackParamList, 'ContentDetail'>;

export function ContentDetailScreen({ route }: Props) {
  const { contentId } = route.params;
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await fetchContentItem(contentId);
      setItem(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const isActivity = item.type === 'activity';

  return (
    <ScreenLayout>
      <Text style={styles.title}>{item.title}</Text>
      {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
      {item.age_range ? <Text style={styles.meta}>Ages {item.age_range}</Text> : null}

      {item.type === 'video' && item.video_url ? (
        <TouchableOpacity
          style={styles.videoButton}
          onPress={() => Linking.openURL(item.video_url!)}
        >
          <Text style={styles.videoButtonText}>Watch video</Text>
        </TouchableOpacity>
      ) : null}

      {item.body_markdown ? (
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>{isActivity ? 'Steps' : 'Content'}</Text>
          <MarkdownBody markdown={item.body_markdown} />
        </Card>
      ) : null}

      {item.psychology_basis && item.psychology_basis.length > 0 ? (
        <Card style={styles.card}>
          <Text style={styles.credibilityLabel}>Psychology basis</Text>
          <Text style={styles.credibilitySublabel}>Evidence-based approach</Text>
          <Text style={styles.body}>{item.psychology_basis.join(' · ')}</Text>
        </Card>
      ) : null}

      {item.for_parents_notes ? (
        <Card style={styles.card}>
          <Text style={styles.credibilityLabel}>For parents</Text>
          <Text style={styles.credibilitySublabel}>How to support your child</Text>
          <Text style={styles.body}>{item.for_parents_notes}</Text>
        </Card>
      ) : null}

      {item.evidence_notes ? (
        <Card style={styles.card}>
          <Text style={styles.credibilityLabel}>Evidence</Text>
          <Text style={styles.credibilitySublabel}>Why this works</Text>
          <Text style={styles.body}>{item.evidence_notes}</Text>
        </Card>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  summary: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  meta: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.md },
  videoButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  videoButtonText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  card: { marginBottom: spacing.md },
  sectionLabel: { ...typography.caption, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  credibilityLabel: { ...typography.caption, fontWeight: '600', color: colors.primary, marginBottom: 2 },
  credibilitySublabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.text },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.text },
});
