import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const STEPS = [
  { icon: '👀', label: 'Look at the person' },
  { icon: '👂', label: 'Listen with your ears' },
  { icon: '🧘', label: 'Keep your body calm' },
];

const STARS = 1;

export interface ListeningGameActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function ListeningGameActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: ListeningGameActivityProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) return;
    setStepIndex((i) => i + 1);
  };

  const handleComplete = async () => {
    if (!childId) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = { steps_completed: 3 };
      await recordProgress(childId, activityId, STARS, metadata);
      setRecorded(true);
      onRecorded?.(STARS);
    } catch {
      // Error surfaced by caller if needed
    } finally {
      setSaving(false);
    }
  };

  if (recorded) {
    return (
      <Card style={styles.card}>
        <Text style={styles.recordedEmoji}>⭐</Text>
        <Text style={styles.recordedText}>You did it! You earned {STARS} star.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activityTitle}</Text>
      <Text style={styles.subtitle}>Practice listening with your eyes, ears, and body. Build friendship skills.</Text>

      <Card style={styles.stepCard}>
        <Text style={styles.stepIcon}>{step.icon}</Text>
        <Text style={styles.stepLabel}>{step.label}</Text>
        {!isLast ? (
          <Button title="Next" onPress={handleNext} style={styles.nextBtn} />
        ) : (
          <Button
            title="I did it! Save my star"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId}
            style={styles.nextBtn}
          />
        )}
      </Card>

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  stepCard: { marginBottom: spacing.lg, alignItems: 'center' },
  stepIcon: { fontSize: 56, marginBottom: spacing.md },
  stepLabel: { ...typography.h3, color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
  nextBtn: { alignSelf: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.childAccent },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
