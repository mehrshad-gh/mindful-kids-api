import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { recordProgress, recordProgressViaPost, type ProgressMetadata } from '../api/progress';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string }; status?: number } }).response;
    if (res?.data?.error) return res.data.error;
    if (res?.status === 404) return 'Not found. Check that the activity and profile are correct.';
    if (res?.status === 401) return 'Please sign in again.';
    if (res?.status && res.status >= 500) return 'Server error. Try again in a moment.';
  }
  return err instanceof Error ? err.message : 'Something went wrong. Try again.';
}

interface CompleteActivityBlockProps {
  activityId: string;
  activityTitle?: string;
  childId: string | null;
  /** Called after progress is saved; receives stars earned. Use to e.g. navigate to reward screen. */
  onRecorded?: (stars: number) => void;
  /** Optional activity-specific data (e.g. { selectedEmotion: 'happy' }) sent with progress. */
  metadata?: ProgressMetadata;
  /** When true, use POST /progress with child_id, activity_id, metadata, timestamp (e.g. Emotion Wheel). */
  usePost?: boolean;
}

const STAR_COUNT = 5;
const DEFAULT_STARS = 3;

export function CompleteActivityBlock({
  activityId,
  activityTitle,
  childId,
  onRecorded,
  metadata,
  usePost = false,
}: CompleteActivityBlockProps) {
  const [stars, setStars] = useState(DEFAULT_STARS);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!childId) {
    return (
      <Card style={styles.card}>
        <Text style={styles.hint}>Select your profile (parent mode) to save your progress.</Text>
      </Card>
    );
  }

  if (recorded) {
    return (
      <Card style={styles.card}>
        <Text style={styles.recordedEmoji}>⭐</Text>
        <Text style={styles.recordedText}>Saved! You earned {stars} star{stars !== 1 ? 's' : ''}.</Text>
      </Card>
    );
  }

  const handleRecord = async () => {
    if (stars < 1) return;
    setSaving(true);
    setError(null);
    try {
      if (usePost) {
        await recordProgressViaPost(childId, activityId, stars, metadata);
      } else {
        await recordProgress(childId, activityId, stars, metadata);
      }
      setRecorded(true);
      onRecorded?.(stars);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      Alert.alert('Could not save', message, [{ text: 'OK' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{activityTitle ?? 'Complete this activity'}</Text>
      <Text style={styles.starLabel}>How many stars? (tap to choose)</Text>
      <View style={styles.starRow}>
        {Array.from({ length: STAR_COUNT }, (_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setStars(i + 1)}
            style={styles.starTouch}
            activeOpacity={0.8}
          >
            <Text style={styles.starEmoji}>{i + 1 <= stars ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button
        title="I finished! Save my stars"
        onPress={handleRecord}
        disabled={stars < 1 || saving}
        loading={saving}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  starLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  starTouch: { padding: spacing.xs },
  starEmoji: { fontSize: 28 },
  button: { alignSelf: 'flex-start' },
  hint: { color: colors.textSecondary, fontSize: 14 },
  recordedEmoji: { fontSize: 32, textAlign: 'center', marginBottom: spacing.xs },
  recordedText: { fontSize: 16, fontWeight: '600', color: colors.success, textAlign: 'center' },
  errorText: { fontSize: 14, color: colors.error, marginBottom: spacing.sm },
});
