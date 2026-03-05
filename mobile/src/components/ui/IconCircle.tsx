import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/spacing';

interface IconCircleProps {
  children: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

const DEFAULT_SIZE = 44;

export function IconCircle({
  children,
  size = DEFAULT_SIZE,
  backgroundColor = colors.surfaceSoft,
  style,
}: IconCircleProps) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
