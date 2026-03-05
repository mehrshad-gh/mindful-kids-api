import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/spacing';

interface StatPillProps {
  value: string | number;
  label: string;
  style?: ViewStyle;
}

export function StatPill({ value, label, style }: StatPillProps) {
  return (
    <View style={[styles.pill, style]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.surfaceSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 64,
  },
  value: { ...typography.CardTitle, color: colors.text },
  label: { ...typography.Caption, color: colors.textSecondary, marginTop: 2 },
});
