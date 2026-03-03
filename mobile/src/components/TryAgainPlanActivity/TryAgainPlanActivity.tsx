import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const CHALLENGES = ['I made a mistake', 'Something was hard', 'I felt frustrated'];
const NEXT_STEPS = ['Try again slowly', 'Ask for help', 'Take a short break'];
const ENCOURAGEMENTS = ['I can do hard things', 'One step at a time', 'I will keep trying'];
const STARS = 2;

export interface TryAgainPlanActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function TryAgainPlanActivity({ activityId, activityTitle, childId, onRecorded }: TryAgainPlanActivityProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleComplete = async () => {
    if (!childId || !challenge || !nextStep || !encouragement) return;
    setSaving(true);
    try {
      await recordProgress(childId, activityId, STARS, {
        challenge_selected: challenge,
        next_step_selected: nextStep,
        encouragement_selected: encouragement,
      } as ProgressMetadata);
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
      <Text style={styles.subtitle}>Practice making a simple plan when something is hard. Build confidence.</Text>
      {step === 1 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick a challenge</Text>
          {CHALLENGES.map((c) => (
            <TouchableOpacity key={c} onPress={() => setChallenge(c)} style={[styles.option, challenge === c && styles.optionSelected]} activeOpacity={0.7}>
              <Text style={styles.optionText}>{c}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Next" onPress={() => setStep(2)} disabled={!challenge} style={styles.nextBtn} />
        </Card>
      )}
      {step === 2 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick a next step</Text>
          {NEXT_STEPS.map((s) => (
            <TouchableOpacity key={s} onPress={() => setNextStep(s)} style={[styles.option, nextStep === s && styles.optionSelected]} activeOpacity={0.7}>
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Next" onPress={() => setStep(3)} disabled={!nextStep} style={styles.nextBtn} />
        </Card>
      )}
      {step === 3 && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Pick encouragement</Text>
          {ENCOURAGEMENTS.map((e) => (
            <TouchableOpacity key={e} onPress={() => setEncouragement(e)} style={[styles.option, encouragement === e && styles.optionSelected]} activeOpacity={0.7}>
              <Text style={styles.optionText}>{e}</Text>
            </TouchableOpacity>
          ))}
          <Button title="I did it! Save my stars" onPress={handleComplete} loading={saving} disabled={saving || !childId || !encouragement} style={styles.nextBtn} />
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
  option: { padding: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: colors.border, marginBottom: spacing.sm },
  optionSelected: { borderColor: colors.childAccent, backgroundColor: `${colors.childAccent}18` },
  optionText: { ...typography.body, color: colors.text },
  nextBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
