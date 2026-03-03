import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MISTAKES = ['I yelled', 'I grabbed', 'I said something mean'];

const REPAIR_ACTIONS = [
  'Say sorry',
  'Ask how they feel',
  'Help fix it',
  'Give space',
];

const PROMISES = [
  'I will try again',
  'Next time I will use calm words',
  'Next time I will ask',
];

const STARS = 2;

export interface RepairScriptActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function RepairScriptActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: RepairScriptActivityProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mistake, setMistake] = useState<string | null>(null);
  const [repairAction, setRepairAction] = useState<string | null>(null);
  const [promise, setPromise] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleComplete = async () => {
    if (!childId || !mistake || !repairAction || !promise) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = {
        mistake_selected: mistake,
        repair_action_selected: repairAction,
        promise_selected: promise,
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
      <Text style={styles.subtitle}>Practice how to make it right after a mistake. Learn to repair and connect again.</Text>

      {step === 1 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick what happened</Text>
          {MISTAKES.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMistake(m)}
              style={[styles.option, mistake === m && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{m}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Next" onPress={() => setStep(2)} disabled={!mistake} style={styles.nextBtn} />
        </Card>
      )}

      {step === 2 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick a repair action</Text>
          {REPAIR_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setRepairAction(a)}
              style={[styles.option, repairAction === a && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{a}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Next" onPress={() => setStep(3)} disabled={!repairAction} style={styles.nextBtn} />
        </Card>
      )}

      {step === 3 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick a promise</Text>
          {PROMISES.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPromise(p)}
              style={[styles.option, promise === p && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{p}</Text>
            </TouchableOpacity>
          ))}
          <Button
            title="I did it! Save my stars"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId || !promise}
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
