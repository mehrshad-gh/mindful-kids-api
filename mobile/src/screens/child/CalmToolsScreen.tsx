import React, { useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { EmotionWheel } from '../../components/EmotionWheel';
import { useAuth } from '../../context/AuthContext';
import { saveEmotionToBackend } from '../../api/emotionLogs';
import type { EmotionOption } from '../../components/EmotionWheel/emotionData';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function CalmToolsScreen() {
  const { selectedChildId } = useAuth();

  const handleSaveEmotion = useCallback(
    async (emotion: EmotionOption) => {
      await saveEmotionToBackend({
        emotionId: emotion.id,
        childId: selectedChildId ?? undefined,
      });
    },
    [selectedChildId]
  );

  const canSave = Boolean(selectedChildId);

  return (
    <ScreenLayout>
      <Text style={styles.title}>Calm Tools</Text>
      <EmotionWheel
        title="How do you feel?"
        childId={selectedChildId}
        onSave={canSave ? handleSaveEmotion : undefined}
      />
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Breathing & relaxation</Text>
        <Text style={styles.cardDesc}>Guided breathing, grounding, and calming exercises.</Text>
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs },
});
