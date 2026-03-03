import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const BRAVE_STEPS = [
  'Raise my hand to ask a question',
  'Say hello to someone',
  'Try something new for 5 minutes',
];

const SUPPORTS = [
  'Ask a grown-up to help',
  'Do it with a friend',
  'Take one slow breath first',
];

const STARS = 2;

export interface BraveStepsActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function BraveStepsActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: BraveStepsActivityProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [braveStep, setBraveStep] = useState<string | null>(null);
  const [support, setSupport] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleComplete = async () => {
    if (!childId || !braveStep || !support) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = {
        brave_step_selected: braveStep,
        support_selected: support,
      };
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
      <Text style={styles.subtitle}>Practice taking one small brave step safely. Build confidence.</Text>

      {step === 1 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick a safe brave step</Text>
          {BRAVE_STEPS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setBraveStep(s)}
              style={[styles.option, braveStep === s && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Next" onPress={() => setStep(2)} disabled={!braveStep} style={styles.nextBtn} />
        </Card>
      )}

      {step === 2 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick support</Text>
          {SUPPORTS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSupport(s)}
              style={[styles.option, support === s && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
          <Button
            title="I did it! Save my stars"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId || !support}
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
  stepTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
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
