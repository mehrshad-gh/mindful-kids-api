import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const FACES: { id: string; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'angry', label: 'Angry', emoji: '😠' },
  { id: 'scared', label: 'Scared', emoji: '😨' },
];

const ROUNDS = 3;
const CORRECT_FOR_ROUND = ['happy', 'sad', 'angry'];
const STARS = 2;

export interface EmotionMatchGameActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function EmotionMatchGameActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: EmotionMatchGameActivityProps) {
  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [allRoundsDone, setAllRoundsDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const correctId = CORRECT_FOR_ROUND[round];
  const isLastRound = round === ROUNDS - 1;

  const handleFaceTap = (faceId: string) => {
    const correct = faceId === correctId;
    setCorrectCount((c) => c + (correct ? 1 : 0));
    setFeedback('Nice noticing!');
    if (isLastRound) {
      setAllRoundsDone(true);
      return;
    }
    setTimeout(() => {
      setFeedback(null);
      setRound((r) => r + 1);
    }, 600);
  };

  const handleComplete = async () => {
    if (!childId) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = {
        rounds_completed: ROUNDS,
        correct_matches: correctCount,
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

  if (allRoundsDone) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{activityTitle}</Text>
        <Card style={styles.wordCard}>
          <Text style={styles.feedback}>Nice noticing! You did all {ROUNDS} rounds.</Text>
          <Button
            title="Save my stars"
            onPress={handleComplete}
            loading={saving}
            disabled={saving || !childId}
            style={styles.completeBtn}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activityTitle}</Text>
      <Text style={styles.subtitle}>Practice noticing feelings. Tap the face that matches the word.</Text>

      <Card style={styles.wordCard}>
        <Text style={styles.wordLabel}>Which face is...</Text>
        <Text style={styles.emotionWord}>{FACES.find((f) => f.id === correctId)?.label ?? correctId}</Text>
      </Card>
      <View style={styles.facesRow}>
        {FACES.map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => handleFaceTap(f.id)}
            style={styles.faceTouch}
            activeOpacity={0.8}
            disabled={!!feedback}
          >
            <Text style={styles.faceEmoji}>{f.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {feedback && !allRoundsDone ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <View style={styles.dots}>
        {Array.from({ length: ROUNDS }, (_, i) => (
          <View key={i} style={[styles.dot, i === round && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  wordCard: { marginBottom: spacing.lg, alignItems: 'center' },
  wordLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  emotionWord: { ...typography.h2, color: colors.childAccent },
  facesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg },
  faceTouch: { padding: spacing.md, backgroundColor: colors.surfaceSubtle, borderRadius: 16 },
  faceEmoji: { fontSize: 48 },
  feedback: { ...typography.h3, color: colors.success, textAlign: 'center', marginBottom: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.childAccent },
  completeBtn: { alignSelf: 'center' },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
