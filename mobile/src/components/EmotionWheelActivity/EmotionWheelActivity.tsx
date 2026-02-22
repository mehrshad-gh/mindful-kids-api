import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmotionWheel } from '../EmotionWheel';
import { Button } from '../ui/Button';
import { CompleteActivityBlock } from '../CompleteActivityBlock';
import { EMOTION_WHEEL_ACTIVITY_EMOTIONS, type EmotionOption } from '../EmotionWheel/emotionData';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface EmotionWheelActivityProps {
  activityId: string;
  activityTitle: string;
  activityDescription?: string | null;
  instructions?: string | null;
  childId: string | null;
  /** Called when user confirms their emotion selection (returns the selected emotion). */
  onEmotionSelected?: (emotion: EmotionOption) => void;
}

/**
 * Reusable Emotion Wheel activity: circular selector, confirm button, then rate & save.
 * Child-friendly design with tap animation. Returns selected emotion via metadata and onEmotionSelected.
 */
export function EmotionWheelActivity({
  activityId,
  activityTitle,
  activityDescription,
  instructions,
  childId,
  onEmotionSelected,
}: EmotionWheelActivityProps) {
  const [selected, setSelected] = useState<EmotionOption | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    onEmotionSelected?.(selected);
    setConfirmed(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activityTitle}</Text>
      {activityDescription ? (
        <Text style={styles.description}>{activityDescription}</Text>
      ) : null}
      {instructions ? (
        <Text style={styles.instructions}>{instructions}</Text>
      ) : null}

      <EmotionWheel
        emotions={EMOTION_WHEEL_ACTIVITY_EMOTIONS}
        title="Tap how you feel"
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        style={styles.wheel}
      />

      {!confirmed ? (
        <Button
          title="That's the one! ✓"
          onPress={handleConfirm}
          disabled={!selected}
          style={styles.confirmBtn}
        />
      ) : (
        <View style={styles.afterConfirm}>
          {selected && (
            <Text style={styles.chosenText}>
              You chose {selected.emoji} {selected.label}. Nice!
            </Text>
          )}
          <Text style={styles.ratePrompt}>Rate how it went and save your stars!</Text>
          <CompleteActivityBlock
            activityId={activityId}
            activityTitle="Rate & save"
            childId={childId}
            metadata={selected ? { selectedEmotion: selected.id } : undefined}
            usePost
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  instructions: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  wheel: {
    marginVertical: spacing.md,
  },
  confirmBtn: {
    alignSelf: 'center',
    minWidth: 200,
  },
  afterConfirm: {
    marginTop: spacing.lg,
  },
  chosenText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.childAccent,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  ratePrompt: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
