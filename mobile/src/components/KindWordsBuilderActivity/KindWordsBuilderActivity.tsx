import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const SITUATIONS = [
  'Someone took my toy',
  'I want to join a game',
  'I feel left out',
];

const SENTENCES = [
  'Can I have a turn?',
  "I'd like to play with you",
  'I feel sad. Can we talk?',
];

const STARS = 2;

export interface KindWordsBuilderActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function KindWordsBuilderActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: KindWordsBuilderActivityProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [scenario, setScenario] = useState<string | null>(null);
  const [sentence, setSentence] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleComplete = async () => {
    if (!childId || !scenario || !sentence) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = {
        scenario_selected: scenario,
        sentence_selected: sentence,
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
      <Text style={styles.subtitle}>Practice connecting. Choose kind words when you talk to someone.</Text>

      {step === 1 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Choose a situation</Text>
          {SITUATIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setScenario(s)}
              style={[styles.option, scenario === s && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Next" onPress={() => setStep(2)} disabled={!scenario} style={styles.nextBtn} />
        </Card>
      )}

      {step === 2 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Choose a kind sentence</Text>
          {SENTENCES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSentence(s)}
              style={[styles.bigOption, sentence === s && styles.optionSelected]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
          <Button
            title="I did it! Save my stars"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId || !sentence}
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
  bigOption: {
    padding: spacing.lg,
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
