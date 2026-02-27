import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ViewStyle,
} from 'react-native';
import type { EmotionOption } from './emotionData';
import { DEFAULT_EMOTIONS } from './emotionData';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 48, 320);
const CENTER = WHEEL_SIZE / 2;
const RADIUS = (WHEEL_SIZE - 80) / 2;
const SEGMENT_SIZE = 56;

export interface EmotionWheelProps {
  /** Emotion options (default: built-in child-friendly set) */
  emotions?: EmotionOption[];
  /** Called when user selects an emotion (before save) */
  onSelect?: (emotion: EmotionOption) => void;
  /** Called to persist selection. Return a Promise; component shows saving state. */
  onSave?: (emotion: EmotionOption) => Promise<void>;
  /** Optional child ID for backend context */
  childId?: string | null;
  /** Center title */
  title?: string;
  /** Selected emotion (controlled) */
  selectedId?: string | null;
  /** Style */
  style?: ViewStyle;
}

export function EmotionWheel({
  emotions = DEFAULT_EMOTIONS,
  onSelect,
  onSave,
  childId,
  title = 'How do you feel?',
  selectedId: controlledSelectedId,
  style,
}: EmotionWheelProps) {
  const [internalSelected, setInternalSelected] = useState<EmotionOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const scaleAnims = useRef<Record<string, Animated.Value>>({}).current;

  const selected = controlledSelectedId != null
    ? emotions.find((e) => e.id === controlledSelectedId) ?? internalSelected
    : internalSelected;

  const getScaleAnim = (id: string) => {
    if (!scaleAnims[id]) scaleAnims[id] = new Animated.Value(1);
    return scaleAnims[id];
  };

  const handlePressIn = (id: string) => {
    Animated.spring(getScaleAnim(id), {
      toValue: 1.15,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = (id: string) => {
    Animated.spring(getScaleAnim(id), {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handleSelect = async (emotion: EmotionOption) => {
    if (isSaving) return;
    onSelect?.(emotion);
    if (controlledSelectedId == null) setInternalSelected(emotion);
    setSaveSuccess(false);

    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(emotion);
        setSaveSuccess(true);
      } catch (_) {
        // Caller can show error via onSave throwing or a separate prop
      } finally {
        setIsSaving(false);
      }
    }
  };

  const count = emotions.length;
  const sliceAngle = (2 * Math.PI) / count;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.wheel, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
        {emotions.map((emotion, index) => {
          const angle = index * sliceAngle - Math.PI / 2;
          const x = CENTER + RADIUS * Math.cos(angle) - SEGMENT_SIZE / 2;
          const y = CENTER + RADIUS * Math.sin(angle) - SEGMENT_SIZE / 2;
          const isSelected = selected?.id === emotion.id;

          return (
            <Animated.View
              key={emotion.id}
              style={[
                styles.segmentWrapper,
                {
                  left: x,
                  top: y,
                  width: SEGMENT_SIZE,
                  height: SEGMENT_SIZE,
                  transform: [{ scale: getScaleAnim(emotion.id) }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.segment,
                  { backgroundColor: emotion.color },
                  isSelected && styles.segmentSelected,
                ]}
                onPress={() => handleSelect(emotion)}
                onPressIn={() => handlePressIn(emotion.id)}
                onPressOut={() => handlePressOut(emotion.id)}
                activeOpacity={1}
                disabled={isSaving}
              >
                <Text style={styles.emoji}>{emotion.emoji}</Text>
                <Text style={styles.label} numberOfLines={1}>
                  {emotion.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <View style={styles.center} pointerEvents="none">
          <View style={styles.centerInner}>
            <Text style={styles.centerTitle}>{title}</Text>
            {selected && (
              <Text style={styles.centerSelected}>
                {selected.emoji} {selected.label}
              </Text>
            )}
            {isSaving && <Text style={styles.savingText}>Saving…</Text>}
            {saveSuccess && !isSaving && (
              <Text style={styles.successText}>Saved!</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  wheel: {
    position: 'relative',
  },
  segmentWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 3,
    borderColor: 'transparent',
    minWidth: 56,
    minHeight: 56,
  },
  segmentSelected: {
    borderColor: colors.text,
    borderWidth: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  center: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerInner: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  centerSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  savingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  successText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    marginTop: 4,
  },
});
