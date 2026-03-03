import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recordProgress, type ProgressMetadata } from '../../api/progress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const BODY_AREAS = [
  { id: 'head', label: 'Head' },
  { id: 'chest', label: 'Chest' },
  { id: 'stomach', label: 'Stomach' },
  { id: 'hands', label: 'Hands' },
  { id: 'legs', label: 'Legs' },
];

const MIN_SELECT = 1;
const MAX_SELECT = 3;
const STARS = 2;

export interface BodySignalsMapActivityProps {
  activityId: string;
  activityTitle: string;
  childId: string | null;
  onRecorded?: (stars: number) => void;
}

export function BodySignalsMapActivity({
  activityId,
  activityTitle,
  childId,
  onRecorded,
}: BodySignalsMapActivityProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  };

  const canContinue = selected.length >= MIN_SELECT && selected.length <= MAX_SELECT;

  const handleComplete = async () => {
    if (!childId || !canContinue) return;
    setSaving(true);
    try {
      const metadata: ProgressMetadata = { body_areas_selected: selected };
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
      <Text style={styles.subtitle}>Practice noticing where feelings show up in your body. Tap 1 to 3 areas.</Text>

      <Card style={styles.promptCard}>
        <Text style={styles.prompt}>Where do you feel it?</Text>
        <View style={styles.areasRow}>
          {BODY_AREAS.map((area) => (
            <TouchableOpacity
              key={area.id}
              onPress={() => toggle(area.id)}
              style={[styles.areaChip, selected.includes(area.id) && styles.areaChipSelected]}
              activeOpacity={0.8}
            >
              <Text style={styles.areaLabel}>{area.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>
          {selected.length} selected. {canContinue ? 'Tap Continue below.' : `Choose ${MIN_SELECT} to ${MAX_SELECT} areas.`}
        </Text>
      </Card>

      <Button
        title="Continue"
        onPress={handleComplete}
        loading={saving}
        disabled={saving || !childId || !canContinue}
        style={styles.continueBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  promptCard: { marginBottom: spacing.lg },
  prompt: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  areasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  areaChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  areaChipSelected: { borderColor: colors.childAccent, backgroundColor: `${colors.childAccent}18` },
  areaLabel: { ...typography.body, color: colors.text },
  hint: { ...typography.caption, color: colors.textSecondary },
  continueBtn: { alignSelf: 'flex-start' },
  card: { marginTop: spacing.md, alignItems: 'center' },
  recordedEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  recordedText: { ...typography.h3, color: colors.success, textAlign: 'center' },
});
