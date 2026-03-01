import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, shadows } from '../../theme/spacing';
import { layout } from '../../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glow';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  /** Optional left accent bar (e.g. primary, childAccent) */
  accentColor?: string;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', accentColor, style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'glow' && styles.glow,
        accentColor ? [styles.accent, { borderLeftColor: accentColor }] : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  elevated: {
    ...shadows.md,
    borderColor: 'transparent',
  },
  outlined: {
    shadowOpacity: 0,
    elevation: 0,
    borderColor: colors.border,
  },
  glow: {
    ...shadows.glow,
    borderColor: colors.primary + '20',
  },
  accent: {
    borderLeftWidth: 4,
  },
});
