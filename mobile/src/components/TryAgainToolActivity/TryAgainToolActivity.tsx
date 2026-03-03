import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const WHAT_HAPPENED = [
  "I didn't do well at something",
  "I got frustrated and quit",
  "Something didn't work out",
];

const NEXT_TIME_OPTIONS = [
  'Practice a little more',
  'Ask for help next time',
  'Take a break and try again later',
];

const STARS = 1;

export interface TryAgainToolActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function TryAgainToolActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: TryAgainToolActivityProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reflectionChoice, setReflectionChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleComplete = async () => {
    if (!childId || !reflectionChoice) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = { reflection_choice: reflectionChoice };
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
      <Text style={styles.subtitle}>Practice thinking about what to do differently next time. Build thinking skills.</Text>

      {step === 1 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>What didn't go how you wanted?</Text>
          <Text style={styles.stepHint}>Tap one (or think of your own)</Text>
          {WHAT_HAPPENED.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStep(2)}
              style={styles.option}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {step === 2 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>What could you try next time?</Text>
          <Text style={styles.stepHint}>Tap one</Text>
          {NEXT_TIME_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o}
              onPress={() => setReflectionChoice(o)}
              style={[styles.option, reflectionChoice === o && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{o}</Text>
            </TouchableOpacity>
          ))}
          <Button
            title="I did it! Save my star"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId || !reflectionChoice}
            style={styles.nextBtn}
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  stepCard: { marginBottom: spacing.lg },
  stepTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  stepHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  option: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionSelected: { borderColor: colors.childAccent, backgroundColor: `${colors.childAccent}18` },
  optionText: { ...typography.body, color: colors.text },
  nextBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
