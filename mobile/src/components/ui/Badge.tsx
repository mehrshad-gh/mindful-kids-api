import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../design/colors';
import { typography } from '../../design/typography';
import { radius } from '../../design/radius';
import { spacing } from '../../design/spacing';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'domain';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** For variant="domain", pass domain color */
  color?: string;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', color, style }: BadgeProps) {
  const bg =
    variant === 'primary'
      ? colors.primaryLight
      : variant === 'success'
        ? colors.successMuted
        : variant === 'warning'
          ? colors.warningMuted
          : variant === 'domain' && color
            ? color + '22'
            : colors.surfaceSoft;
  const textColor =
    variant === 'primary'
      ? colors.primaryDark
      : variant === 'success'
        ? colors.success
        : variant === 'warning'
          ? colors.warning
          : variant === 'domain' && color
            ? color
            : colors.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.small,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.Caption,
    fontWeight: '600',
  },
});
