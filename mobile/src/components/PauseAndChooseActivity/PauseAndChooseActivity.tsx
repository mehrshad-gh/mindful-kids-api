import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const SCENARIOS = [
  'Something didn’t go my way',
  'Someone said something that hurt',
  'I had to stop doing something I liked',
];

const CHOICES = [
  'Take a breath and try again',
  'Ask for help',
  'Do something calm for a minute',
];

const STARS = 2;

export interface PauseAndChooseActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function PauseAndChooseActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: PauseAndChooseActivityProps) {
  const [phase, setPhase] = useState<'scenario' | 'breath' | 'choice' | 'done'>('scenario');
  const [scenario, setScenario] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleComplete = async () => {
    if (!childId) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = {
        scenario_selected: scenario ?? '',
        choice_selected: choice ?? '',
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
      <Text style={styles.subtitle}>Practice slowing down: stop, breathe, then choose what to do next.</Text>

      {phase === 'scenario' && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>What happened?</Text>
          <Text style={styles.stepHint}>Tap one (or think of your own)</Text>
          {SCENARIOS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setScenario(s)}
              style={[styles.option, scenario === s && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Next" onPress={() => setPhase('breath')} disabled={!scenario} style={styles.nextBtn} />
        </Card>
      )}

      {phase === 'breath' && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Take one slow breath</Text>
          <Text style={styles.breathHint}>Breathe in… then out. Nice and slow.</Text>
          <Button title="I did it" onPress={() => setPhase('choice')} style={styles.nextBtn} />
        </Card>
      )}

      {phase === 'choice' && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>What could you choose?</Text>
          <Text style={styles.stepHint}>Tap one (or think of your own)</Text>
          {CHOICES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setChoice(c)}
              style={[styles.option, choice === c && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{c}</Text>
            </TouchableOpacity>
          ))}
          <Button
            title="I did it! Save my stars"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId || !choice}
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
  breathHint: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, fontStyle: 'italic' },
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
