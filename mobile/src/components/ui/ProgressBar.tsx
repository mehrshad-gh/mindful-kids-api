import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors } from '../../design/colors';
import { radius } from '../../design/radius';

interface ProgressBarProps {
  /** 0–1 */
  progress: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  backgroundColor = colors.border,
  fillColor = colors.primary,
  animated = true,
  style,
}: ProgressBarProps) {
  const pct = Math.min(1, Math.max(0, progress));
  const animValue = useRef(new Animated.Value(animated ? 0 : pct)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animValue, {
        toValue: pct,
        duration: 400,
        useNativeDriver: false,
      }).start();
    } else {
      animValue.setValue(pct);
    }
  }, [pct, animated, animValue]);

  return (
    <View style={[styles.track, { height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: fillColor,
            width: `${pct * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.full,
  },
});
