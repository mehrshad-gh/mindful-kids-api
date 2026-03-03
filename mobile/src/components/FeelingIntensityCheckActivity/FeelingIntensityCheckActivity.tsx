import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const EMOTIONS = [
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'scared', label: 'Scared' },
  { id: 'calm', label: 'Calm' },
  { id: 'excited', label: 'Excited' },
];

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Small',
  2: 'A little',
  3: 'Medium',
  4: 'Big',
  5: 'Really big',
};

const STARS = 1;

export interface FeelingIntensityCheckActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function FeelingIntensityCheckActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: FeelingIntensityCheckActivityProps) {
  const [emotion, setEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleComplete = async () => {
    if (!childId || !emotion) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = { emotion, intensity };
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
      <Text style={styles.subtitle}>Practice noticing how strong a feeling is. Learn to name feelings.</Text>

      <Card style={styles.section}>
        <Text style={styles.label}>Pick a feeling</Text>
        <View style={styles.emotionRow}>
          {EMOTIONS.map((e) => (
            <Button
              key={e.id}
              title={e.label}
              variant={emotion === e.id ? 'primary' : 'outline'}
              onPress={() => setEmotion(e.id)}
              style={styles.emotionBtn}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.label}>How big is the feeling?</Text>
        <Text style={styles.intensityValue}>{INTENSITY_LABELS[intensity] ?? 'Medium'}</Text>
        <View style={styles.intensityRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setIntensity(n)}
              style={[styles.intensityBtn, intensity === n && styles.intensityBtnSelected]}
              activeOpacity={0.8}
            >
              <Text style={[styles.intensityBtnText, intensity === n && styles.intensityBtnTextSelected]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>Small</Text>
          <Text style={styles.sliderLabel}>Big</Text>
        </View>
      </Card>

      <Button
        title="Save"
        onPress={handleComplete}
        loading={saving}
        disabled={saving || !childId || !emotion}
        style={styles.saveBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  section: { marginBottom: spacing.lg },
  label: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emotionBtn: { marginBottom: 0 },
  intensityValue: { ...typography.h3, color: colors.childAccent, marginBottom: spacing.sm },
  intensityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  intensityBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  intensityBtnSelected: { borderColor: colors.childAccent, backgroundColor: `${colors.childAccent}18` },
  intensityBtnText: { ...typography.h3, color: colors.text },
  intensityBtnTextSelected: { color: colors.childAccent },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { ...typography.caption, color: colors.textSecondary },
  saveBtn: { alignSelf: 'flex-start' },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
