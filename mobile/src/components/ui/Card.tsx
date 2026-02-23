import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { layout } from '../../theme';

type CardVariant = 'default' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  return <View style={[styles.card, variant === 'elevated' && styles.elevated, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  elevated: {
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});
