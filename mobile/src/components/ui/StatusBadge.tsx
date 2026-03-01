import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/spacing';

type StatusVariant = 'pending' | 'approved' | 'rejected' | 'suspended' | 'draft' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  style?: ViewStyle;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string }> = {
  pending: { bg: colors.badgePending, text: colors.info },
  approved: { bg: colors.badgeApproved, text: colors.success },
  rejected: { bg: colors.badgeRejected, text: colors.error },
  suspended: { bg: colors.badgeSuspended, text: colors.warning },
  draft: { bg: colors.badgeDraft, text: colors.textSecondary },
  neutral: { bg: colors.badgeDraft, text: colors.textSecondary },
};

export function StatusBadge({ label, variant = 'neutral', style }: StatusBadgeProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
});
