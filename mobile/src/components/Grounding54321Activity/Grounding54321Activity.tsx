import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const STEPS = [
  { n: 5, sense: 'see', prompt: 'Name 5 things you can see.' },
  { n: 4, sense: 'feel', prompt: 'Name 4 things you can feel (feet on floor, shirt on skin).' },
  { n: 3, sense: 'hear', prompt: 'Name 3 things you can hear.' },
  { n: 2, sense: 'smell', prompt: 'Name 2 things you can smell.' },
  { n: 1, sense: 'like', prompt: 'Name 1 thing you like.' },
];

const STARS = 2;

export interface Grounding54321ActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function Grounding54321Activity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: Grounding54321ActivityProps) {
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
      const metadata: ProgressMetadata = { steps_completed: 5 };
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
        <Text style={styles.recordedText}>You did it! You earned {STARS} stars.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activityTitle}</Text>
      <Text style={styles.subtitle}>Build calm skills by noticing what’s around you.</Text>

      <Card style={styles.stepCard}>
        <Text style={styles.stepNumber}>{step.n}</Text>
        <Text style={styles.stepPrompt}>{step.prompt}</Text>
        {!isLast ? (
          <Button title="Next" onPress={handleNext} style={styles.nextBtn} />
        ) : (
          <Button
            title="I did it! Save my stars"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId}
            style={styles.nextBtn}
          />
        )}
      </Card>

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === stepIndex && styles.dotActive]}
          />
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
  stepNumber: { fontSize: 48, fontWeight: '800', color: colors.childAccent, marginBottom: spacing.md },
  stepPrompt: { ...typography.body, color: colors.text, marginBottom: spacing.lg, textAlign: 'center', paddingHorizontal: spacing.sm },
  nextBtn: { alignSelf: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.childAccent, transform: [{ scale: 1.2 }] },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
