import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const DURATION_SECONDS = 30;
const STARS = 1;

export interface CalmBodyResetActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function CalmBodyResetActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: CalmBodyResetActivityProps) {
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [started, setStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || secondsLeft <= 0) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, secondsLeft]);

  const handleComplete = async () => {
    if (!childId) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = { duration_seconds: DURATION_SECONDS };
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
        <Text style={styles.recordedText}>Nice reset! You earned {STARS} star.</Text>
      </Card>
    );
  }

  if (!started) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{activityTitle}</Text>
        <Text style={styles.subtitle}>Learn to reset your body with a 30-second movement break.</Text>
        <Card style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>What to do</Text>
          <Text style={styles.instructionStep}>1. Jump in place 5 times</Text>
          <Text style={styles.instructionStep}>2. Stretch arms up high, then touch your toes</Text>
          <Text style={styles.instructionStep}>3. Shake your arms and hands like a wobbly jelly</Text>
        </Card>
        <Button title="Start 30 seconds" onPress={() => setStarted(true)} style={styles.startBtn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activityTitle}</Text>
      <Card style={styles.timerCard}>
        <Text style={styles.timerNumber}>{secondsLeft}</Text>
        <Text style={styles.timerLabel}>seconds left</Text>
      </Card>
      {secondsLeft === 0 ? (
        <Button
          title="I did it! Save my star"
          onPress={handleComplete}
          loading={saving}
          disabled={saving || !childId}
          style={styles.completeBtn}
        />
      ) : (
        <Text style={styles.encourage}>Keep going! Jump, stretch, shake.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  instructionCard: { marginBottom: spacing.lg },
  instructionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  instructionStep: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  startBtn: { alignSelf: 'center' },
  timerCard: { marginBottom: spacing.lg, alignItems: 'center', paddingVertical: spacing.xl },
  timerNumber: { fontSize: 56, fontWeight: '800', color: colors.childAccent },
  timerLabel: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  completeBtn: { alignSelf: 'center' },
  encourage: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
